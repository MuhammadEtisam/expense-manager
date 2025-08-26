const Joi = require('joi');

const registerSchema = Joi.object({
    legacy_id: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .messages({
            'string.alphanum': 'ID must contain only alphanumeric characters',
            'string.min': 'ID must be at least 3 characters long',
            'string.max': 'ID must not exceed 30 characters',
            'any.required': 'ID is required'
        }),
    password: Joi.string()
        .min(6)
        .max(128)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long',
            'string.max': 'Password must not exceed 128 characters',
            'any.required': 'Password is required'
        })
});

const loginSchema = Joi.object({
    legacy_id: Joi.string().required(),
    password: Joi.string().required()
});

const expenseSchema = Joi.object({
    amount: Joi.number()
        .positive()
        .precision(2)
        .max(9999999999.99)
        .required()
        .messages({
            'number.positive': 'Amount must be positive',
            'number.max': 'Amount too large',
            'any.required': 'Amount is required'
        }),
    category: Joi.string()
        .valid('FOOD', 'TRANSPORT', 'MISC', 'RENT', 'OTHER')
        .required()
        .messages({
            'any.only': 'Category must be one of: FOOD, TRANSPORT, MISC, RENT, OTHER',
            'any.required': 'Category is required'
        }),
    subcategory: Joi.string()
        .when('category', {
            is: 'FOOD',
            then: Joi.string().valid('BREAKFAST', 'LUNCH', 'DINNER', 'TEA', 'OTHER').required(),
            otherwise: Joi.string().allow(null, '')
        })
        .messages({
            'any.only': 'Food subcategory must be one of: BREAKFAST, LUNCH, DINNER, TEA, OTHER',
            'any.required': 'Food subcategory is required when category is FOOD'
        }),
    date: Joi.date()
        .iso()
        .max('now')
        .required()
        .messages({
            'date.max': 'Date cannot be in the future',
            'any.required': 'Date is required'
        }),
    note: Joi.string()
        .max(500)
        .allow(null, '')
        .messages({
            'string.max': 'Note must not exceed 500 characters'
        })
});

const multipleExpenseSchema = Joi.object({
    date: Joi.date()
        .iso()
        .max('now')
        .required()
        .messages({
            'date.max': 'Date cannot be in the future',
            'any.required': 'Date is required'
        }),
    expenses: Joi.array()
        .items(Joi.object({
            amount: Joi.number()
                .positive()
                .precision(2)
                .max(9999999999.99)
                .required(),
            category: Joi.string()
                .valid('FOOD', 'TRANSPORT', 'MISC', 'RENT', 'OTHER')
                .required(),
            subcategory: Joi.string()
                .when('category', {
                    is: 'FOOD',
                    then: Joi.string().valid('BREAKFAST', 'LUNCH', 'DINNER', 'TEA', 'OTHER').required(),
                    otherwise: Joi.string().allow(null, '')
                }),
            note: Joi.string()
                .max(500)
                .allow(null, '')
        }))
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one expense is required'
        })
});

const updateExpenseSchema = Joi.object({
    amount: Joi.number()
        .positive()
        .precision(2)
        .max(9999999999.99)
        .messages({
            'number.positive': 'Amount must be positive',
            'number.max': 'Amount too large'
        }),
    category: Joi.string()
        .valid('FOOD', 'TRANSPORT', 'MISC', 'RENT', 'OTHER')
        .messages({
            'any.only': 'Category must be one of: FOOD, TRANSPORT, MISC, RENT, OTHER'
        }),
    subcategory: Joi.string()
        .when('category', {
            is: 'FOOD',
            then: Joi.string().valid('BREAKFAST', 'LUNCH', 'DINNER', 'TEA', 'OTHER'),
            otherwise: Joi.string().allow(null, '')
        })
        .messages({
            'any.only': 'Food subcategory must be one of: BREAKFAST, LUNCH, DINNER, TEA, OTHER'
        }),
    date: Joi.date()
        .iso()
        .max('now')
        .messages({
            'date.max': 'Date cannot be in the future'
        }),
    note: Joi.string()
        .max(500)
        .allow(null, '')
        .messages({
            'string.max': 'Note must not exceed 500 characters'
        })
}).min(1);

const querySchema = Joi.object({
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),
    category: Joi.string()
        .valid('FOOD', 'TRANSPORT', 'MISC', 'RENT', 'OTHER')
        .optional(),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    offset: Joi.number().integer().min(0).default(0)
});

const rentSchema = Joi.object({
    amount: Joi.number()
        .positive()
        .precision(2)
        .max(9999999999.99)
        .required()
        .messages({
            'number.positive': 'Amount must be positive',
            'number.max': 'Amount too large',
            'any.required': 'Amount is required'
        }),
    date: Joi.date()
        .iso()
        .max('now')
        .custom((value, helpers) => {
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const expenseDate = new Date(value);

            if (expenseDate.getMonth() !== currentMonth || expenseDate.getFullYear() !== currentYear) {
                return helpers.error('date.currentMonth');
            }

            return value;
        })
        .required()
        .messages({
            'date.max': 'Date cannot be in the future',
            'date.currentMonth': 'Rent date must be in the current month',
            'any.required': 'Date is required'
        }),
    note: Joi.string()
        .max(500)
        .allow(null, '')
        .messages({
            'string.max': 'Note must not exceed 500 characters'
        })
});

module.exports = {
    registerSchema,
    loginSchema,
    expenseSchema,
    multipleExpenseSchema,
    updateExpenseSchema,
    querySchema,
    rentSchema
};