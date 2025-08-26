const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { expenseSchema, multipleExpenseSchema, updateExpenseSchema, querySchema, rentSchema } = require('../validation/schemas');

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get expenses with optional filters
router.get('/', async (req, res) => {
    try {
        // Validate query parameters
        const { error, value } = querySchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }

        const { from, to, category, limit, offset } = value;

        // Build where clause
        const where = {
            owner: req.userId
        };

        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
        }

        if (category) {
            where.category = category;
        }

        // Get expenses with pagination
        const [expenses, total] = await Promise.all([
            prisma.expenses.findMany({
                where,
                orderBy: { date: 'desc' },
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    amount: true,
                    category: true,
                    subcategory: true,
                    date: true,
                    note: true,
                    created_at: true,
                    updated_at: true
                }
            }),
            prisma.expenses.count({ where })
        ]);

        // Calculate totals for current filters
        const totals = await prisma.expenses.aggregate({
            where,
            _sum: {
                amount: true
            },
            _count: {
                _all: true
            }
        });

        res.json({
            success: true,
            data: {
                expenses,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + expenses.length < total
                },
                totals: {
                    amount: totals._sum.amount || 0,
                    count: totals._count._all
                }
            }
        });

    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create new expense
router.post('/', async (req, res) => {
    try {
        // Validate input
        const { error, value } = expenseSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }

        const { amount, category, subcategory, date, note } = value;

        // Additional validation for food subcategories (day-bound)
        if (category === 'FOOD' && ['BREAKFAST', 'LUNCH', 'DINNER'].includes(subcategory)) {
            const existingFood = await prisma.expenses.findFirst({
                where: {
                    owner: req.userId,
                    category: 'FOOD',
                    subcategory: subcategory,
                    date: new Date(date)
                }
            });

            if (existingFood) {
                return res.status(400).json({
                    success: false,
                    message: `You can only have one ${subcategory.toLowerCase()} expense per day`
                });
            }
        }

        // Additional validation for rent (month-bound)
        if (category === 'RENT') {
            const expenseDate = new Date(date);
            const monthStart = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
            const monthEnd = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0);

            const existingRent = await prisma.expenses.findFirst({
                where: {
                    owner: req.userId,
                    category: 'RENT',
                    date: {
                        gte: monthStart,
                        lte: monthEnd
                    }
                }
            });

            if (existingRent) {
                return res.status(400).json({
                    success: false,
                    message: 'Rent has already been paid for this month'
                });
            }
        }

        // Create expense
        const expense = await prisma.expenses.create({
            data: {
                owner: req.userId,
                amount: amount,
                category,
                subcategory: subcategory || null,
                date: new Date(date),
                note: note || null
            },
            select: {
                id: true,
                amount: true,
                category: true,
                subcategory: true,
                date: true,
                note: true,
                created_at: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: expense
        });

    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create multiple expenses for a single date
router.post('/multiple', async (req, res) => {
    try {
        // Validate input
        const { error, value } = multipleExpenseSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }

        const { date, expenses: expenseList } = value;
        const expenseDate = new Date(date);

        // Check for duplicate food subcategories in the request
        const foodSubcategories = expenseList
            .filter(expense => expense.category === 'FOOD')
            .map(expense => expense.subcategory);

        const restrictedSubcategories = ['BREAKFAST', 'LUNCH', 'DINNER'];
        for (const subcategory of restrictedSubcategories) {
            const count = foodSubcategories.filter(sub => sub === subcategory).length;
            if (count > 1) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add multiple ${subcategory.toLowerCase()} expenses in one submission`
                });
            }
        }

        // Check for rent in the request
        const rentExpenses = expenseList.filter(expense => expense.category === 'RENT');
        if (rentExpenses.length > 1) {
            return res.status(400).json({
                success: false,
                message: 'Cannot add multiple rent expenses'
            });
        }

        // Check database constraints for food subcategories
        for (const expense of expenseList) {
            if (expense.category === 'FOOD' && restrictedSubcategories.includes(expense.subcategory)) {
                const existingFood = await prisma.expenses.findFirst({
                    where: {
                        owner: req.userId,
                        category: 'FOOD',
                        subcategory: expense.subcategory,
                        date: expenseDate
                    }
                });

                if (existingFood) {
                    return res.status(400).json({
                        success: false,
                        message: `You already have a ${expense.subcategory.toLowerCase()} expense for this date`
                    });
                }
            }

            // Check rent constraint
            if (expense.category === 'RENT') {
                const monthStart = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
                const monthEnd = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0);

                const existingRent = await prisma.expenses.findFirst({
                    where: {
                        owner: req.userId,
                        category: 'RENT',
                        date: {
                            gte: monthStart,
                            lte: monthEnd
                        }
                    }
                });

                if (existingRent) {
                    return res.status(400).json({
                        success: false,
                        message: 'Rent has already been paid for this month'
                    });
                }
            }
        }

        // Create all expenses in a transaction
        const createdExpenses = await prisma.$transaction(
            expenseList.map(expense =>
                prisma.expenses.create({
                    data: {
                        owner: req.userId,
                        amount: expense.amount,
                        category: expense.category,
                        subcategory: expense.subcategory || null,
                        date: expenseDate,
                        note: expense.note || null
                    },
                    select: {
                        id: true,
                        amount: true,
                        category: true,
                        subcategory: true,
                        date: true,
                        note: true,
                        created_at: true
                    }
                })
            )
        );

        res.status(201).json({
            success: true,
            message: `Successfully created ${createdExpenses.length} expenses`,
            data: createdExpenses
        });

    } catch (error) {
        console.error('Create multiple expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Pay rent endpoint
router.post('/pay-rent', async (req, res) => {
    try {
        // Validate input
        const { error, value } = rentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }

        const { amount, date, note } = value;
        const expenseDate = new Date(date);
        const monthStart = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
        const monthEnd = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0);

        // Check if rent already paid for this month
        const existingRent = await prisma.expenses.findFirst({
            where: {
                owner: req.userId,
                category: 'RENT',
                date: {
                    gte: monthStart,
                    lte: monthEnd
                }
            }
        });

        if (existingRent) {
            return res.status(400).json({
                success: false,
                message: 'Rent has already been paid for this month'
            });
        }

        // Create rent expense
        const rentExpense = await prisma.expenses.create({
            data: {
                owner: req.userId,
                amount: amount,
                category: 'RENT',
                subcategory: null,
                date: expenseDate,
                note: note || null
            },
            select: {
                id: true,
                amount: true,
                category: true,
                subcategory: true,
                date: true,
                note: true,
                created_at: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Rent payment recorded successfully',
            data: rentExpense
        });

    } catch (error) {
        console.error('Pay rent error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Check rent status for current month
router.get('/rent-status', async (req, res) => {
    try {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const rentExpense = await prisma.expenses.findFirst({
            where: {
                owner: req.userId,
                category: 'RENT',
                date: {
                    gte: monthStart,
                    lte: monthEnd
                }
            },
            select: {
                id: true,
                amount: true,
                date: true,
                note: true
            }
        });

        res.json({
            success: true,
            data: {
                paid: !!rentExpense,
                expense: rentExpense,
                month: {
                    start: monthStart,
                    end: monthEnd
                }
            }
        });

    } catch (error) {
        console.error('Check rent status error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get restrictions for a specific date (for UI validation)
router.get('/restrictions/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const expenseDate = new Date(date);

        if (isNaN(expenseDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        // Check existing food subcategories for the date
        const existingFood = await prisma.expenses.findMany({
            where: {
                owner: req.userId,
                category: 'FOOD',
                date: expenseDate,
                subcategory: {
                    in: ['BREAKFAST', 'LUNCH', 'DINNER']
                }
            },
            select: {
                subcategory: true
            }
        });

        // Check rent for the month
        const monthStart = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1);
        const monthEnd = new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 0);

        const existingRent = await prisma.expenses.findFirst({
            where: {
                owner: req.userId,
                category: 'RENT',
                date: {
                    gte: monthStart,
                    lte: monthEnd
                }
            }
        });

        res.json({
            success: true,
            data: {
                unavailableFood: existingFood.map(f => f.subcategory),
                rentPaid: !!existingRent
            }
        });

    } catch (error) {
        console.error('Get restrictions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update expense
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate input
        const { error, value } = updateExpenseSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }

        // Check if expense exists and belongs to user
        const existingExpense = await prisma.expenses.findUnique({
            where: { id }
        });

        if (!existingExpense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        if (existingExpense.owner !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this expense'
            });
        }

        // Additional validation if changing category or subcategory
        if (value.category === 'FOOD' && value.subcategory && ['BREAKFAST', 'LUNCH', 'DINNER'].includes(value.subcategory)) {
            const checkDate = value.date ? new Date(value.date) : existingExpense.date;
            const existingFood = await prisma.expenses.findFirst({
                where: {
                    owner: req.userId,
                    category: 'FOOD',
                    subcategory: value.subcategory,
                    date: checkDate,
                    id: { not: id } // Exclude current expense
                }
            });

            if (existingFood) {
                return res.status(400).json({
                    success: false,
                    message: `You can only have one ${value.subcategory.toLowerCase()} expense per day`
                });
            }
        }

        if (value.category === 'RENT') {
            const checkDate = value.date ? new Date(value.date) : existingExpense.date;
            const monthStart = new Date(checkDate.getFullYear(), checkDate.getMonth(), 1);
            const monthEnd = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 0);

            const existingRent = await prisma.expenses.findFirst({
                where: {
                    owner: req.userId,
                    category: 'RENT',
                    date: {
                        gte: monthStart,
                        lte: monthEnd
                    },
                    id: { not: id } // Exclude current expense
                }
            });

            if (existingRent) {
                return res.status(400).json({
                    success: false,
                    message: 'Rent has already been paid for this month'
                });
            }
        }

        // Prepare update data
        const updateData = {};
        if (value.amount !== undefined) updateData.amount = value.amount;
        if (value.category !== undefined) updateData.category = value.category;
        if (value.subcategory !== undefined) updateData.subcategory = value.subcategory || null;
        if (value.date !== undefined) updateData.date = new Date(value.date);
        if (value.note !== undefined) updateData.note = value.note || null;

        // Update expense
        const expense = await prisma.expenses.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                amount: true,
                category: true,
                subcategory: true,
                date: true,
                note: true,
                created_at: true,
                updated_at: true
            }
        });

        res.json({
            success: true,
            message: 'Expense updated successfully',
            data: expense
        });

    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if expense exists and belongs to user
        const existingExpense = await prisma.expenses.findUnique({
            where: { id }
        });

        if (!existingExpense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        if (existingExpense.owner !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this expense'
            });
        }

        // Delete expense
        await prisma.expenses.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });

    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;