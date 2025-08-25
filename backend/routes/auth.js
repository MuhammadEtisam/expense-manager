const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { registerSchema, loginSchema } = require('../validation/schemas');

const router = express.Router();
const prisma = new PrismaClient();

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        // Validate input
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }

        const { legacy_id, password } = value;

        // Check if user already exists
        const existingUser = await prisma.users_v1.findUnique({
            where: { legacy_id }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User ID already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await prisma.users_v1.create({
            data: {
                legacy_id,
                password_hash
            },
            select: {
                legacy_id: true,
                created_at: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userId: user.legacy_id,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        // Validate input
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details: error.details.map(detail => detail.message)
            });
        }

        const { legacy_id, password } = value;

        // Find user
        const user = await prisma.users_v1.findUnique({
            where: { legacy_id }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.legacy_id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                userId: user.legacy_id,
                expiresIn: 3600 // 1 hour in seconds
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;