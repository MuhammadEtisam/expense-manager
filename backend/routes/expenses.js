const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { expenseSchema, updateExpenseSchema, querySchema } = require('../validation/schemas');

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

        const { amount, category, date, note } = value;

        // Create expense
        const expense = await prisma.expenses.create({
            data: {
                owner: req.userId,
                amount: amount,
                category,
                date: new Date(date),
                note: note || null
            },
            select: {
                id: true,
                amount: true,
                category: true,
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

        // Prepare update data
        const updateData = {};
        if (value.amount !== undefined) updateData.amount = value.amount;
        if (value.category !== undefined) updateData.category = value.category;
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