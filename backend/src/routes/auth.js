const express = require('express');
const { body, validationResult } = require('express-validator');
const { sql, getPool } = require('../db');

const router = express.Router();

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.post(
    '/register',
    [
        body('customerName').trim().notEmpty(),
        body('lastName').trim().notEmpty(),
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('phoneNo').trim().notEmpty()
    ],
    handleValidation,
    async (req, res) => {
        try {
            const pool = await getPool();
            const request = pool.request();

            request.input('CustomerName', sql.NVarChar(100), req.body.customerName);
            request.input('LastName', sql.NVarChar(100), req.body.lastName);
            request.input('Email', sql.NVarChar(150), req.body.email);
            request.input('PlainPassword', sql.NVarChar(255), req.body.password);
            request.input('PhoneNo', sql.NVarChar(20), req.body.phoneNo);
            request.input('DateOfBirth', sql.Date, req.body.dateOfBirth || null);
            request.output('CustomerID', sql.Int);

            const result = await request.execute('sp_RegisterCustomer');
            const customerId = result.output.CustomerID;

            res.status(201).json({
                message: 'Registration successful.',
                customerId
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

router.post(
    '/login',
    [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
    handleValidation,
    async (req, res) => {
        try {
            const pool = await getPool();
            const request = pool.request();

            request.input('Email', sql.NVarChar(150), req.body.email);
            request.input('PlainPassword', sql.NVarChar(255), req.body.password);

            const result = await request.execute('sp_LoginCustomer');
            const payload = result.recordset?.[0];

            if (!payload || payload.Success === 0) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            res.json({
                customerId: payload.CustomerID,
                fullName: payload.FullName,
                email: payload.Email,
                phone: payload.PhoneNo
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

module.exports = router;

