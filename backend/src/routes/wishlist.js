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

router.get('/:customerId', async (req, res) => {
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('CustomerID', sql.Int, req.params.customerId);

        const result = await request.query(`
            SELECT 
                w.WishlistID,
                p.ProductID,
                p.Name,
                p.Price,
                pi.ImageURL
            FROM Wishlist w
            INNER JOIN Product p ON p.ProductID = w.ProductID
            OUTER APPLY (
                SELECT TOP 1 ImageURL FROM ProductImage WHERE ProductID = p.ProductID AND IsPrimary = 1
            ) pi
            WHERE w.CustomerID = @CustomerID
        `);

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post(
    '/',
    [body('customerId').isInt({ min: 1 }), body('productId').isInt({ min: 1 })],
    validate,
    async (req, res) => {
        try {
            const pool = await getPool();
            const request = pool.request();
            request.input('CustomerID', sql.Int, req.body.customerId);
            request.input('ProductID', sql.Int, req.body.productId);

            await request.query(`
                IF NOT EXISTS (
                    SELECT 1 FROM Wishlist WHERE CustomerID = @CustomerID AND ProductID = @ProductID
                )
                BEGIN
                    INSERT INTO Wishlist (CustomerID, ProductID) VALUES (@CustomerID, @ProductID);
                END
            `);

            res.status(201).json({ message: 'Added to wishlist.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

router.delete('/:customerId/:productId', async (req, res) => {
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('CustomerID', sql.Int, req.params.customerId);
        request.input('ProductID', sql.Int, req.params.productId);

        await request.query(`
            DELETE FROM Wishlist
            WHERE CustomerID = @CustomerID AND ProductID = @ProductID
        `);

        res.json({ message: 'Removed from wishlist.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

