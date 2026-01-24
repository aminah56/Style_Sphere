
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
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query("SELECT TOP 10 * FROM Customer");
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

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

// Get User Profile with Stats (Order Count, Saved Cards)
router.get('/:id/profile', async (req, res) => {
    try {
        const userId = req.params.id;
        const pool = await getPool();

        // 1. Get Core User Details (Double check)
        const userQuery = `
            SELECT CustomerName, LastName, Email, PhoneNo, CreatedAt 
            FROM Customer WHERE CustomerID = @ID
        `;
        const userRes = await pool.request()
            .input('ID', sql.Int, userId)
            .query(userQuery);

        if (userRes.recordset.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userData = userRes.recordset[0];

        // 2. Get Order Count
        const orderQuery = `
            SELECT COUNT(*) as TotalOrders 
            FROM Orders 
            WHERE CustomerID = @ID
        `;
        const orderRes = await pool.request()
            .input('ID', sql.Int, userId)
            .query(orderQuery);

        // 3. Get Saved Cards (Distinct cards from past Completed payments)
        const cardQuery = `
            SELECT DISTINCT p.CardLast4Digits, p.PaymentMethod
            FROM Payment p
            INNER JOIN Orders o ON o.OrderID = p.OrderID
            WHERE o.CustomerID = @ID 
              AND p.CardLast4Digits IS NOT NULL
              AND p.PaymentStatus = 'Completed'
        `;
        const cardRes = await pool.request()
            .input('ID', sql.Int, userId)
            .query(cardQuery);

        res.json({
            user: {
                ...userData,
                fullName: `${userData.CustomerName} ${userData.LastName}`
            },
            stats: {
                totalOrders: orderRes.recordset[0].TotalOrders
            },
            savedCards: cardRes.recordset
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
