
const express = require('express');
const { body, validationResult } = require('express-validator');
const { getPool, sql } = require('../db');

const router = express.Router();

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Start or update user address (simplification: assume adding new address for checkout)
router.post(
    '/address',
    [
        body('customerId').isInt(),
        body('street').isString().notEmpty(),
        body('city').isString().notEmpty(),
        body('postalCode').isString().notEmpty(),
        body('country').isString().notEmpty()
    ],
    validate,
    async (req, res) => {
        try {
            const pool = await getPool();
            const request = pool.request();
            request.input('CustomerID', sql.Int, req.body.customerId);
            request.input('Street', sql.NVarChar(200), req.body.street);
            request.input('City', sql.NVarChar(100), req.body.city);
            request.input('PostalCode', sql.NVarChar(20), req.body.postalCode);
            request.input('Country', sql.NVarChar(100), req.body.country);

            // Check if address exists or insert new.
            // For simplicity and to avoid duplicates, we could check first, or just always insert.
            // But typical checkout flow might want to save it as default if none exists.

            const query = `
                INSERT INTO Address (CustomerID, Street, City, PostalCode, Country, IsDefault)
                VALUES (@CustomerID, @Street, @City, @PostalCode, @Country, 
                    CASE WHEN NOT EXISTS(SELECT 1 FROM Address WHERE CustomerID = @CustomerID) THEN 1 ELSE 0 END
                );
                SELECT SCOPE_IDENTITY() AS AddressID;
            `;

            const result = await request.query(query);
            res.json({ addressId: result.recordset[0].AddressID });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

module.exports = router;
