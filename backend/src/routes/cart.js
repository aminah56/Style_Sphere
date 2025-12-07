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
                ci.CartItemID,
                ci.Quantity,
                ci.UnitPrice,
                ci.Subtotal,
                p.ProductID,
                p.Name,
                pi.ImageURL,
                pv.VariantID,
                pv.SKU
            FROM CartItem ci
            INNER JOIN Cart c ON c.CartID = ci.CartID
            INNER JOIN ProductVariant pv ON pv.VariantID = ci.VariantID
            INNER JOIN Product p ON p.ProductID = pv.ProductID
            OUTER APPLY (
                SELECT TOP 1 ImageURL FROM ProductImage WHERE ProductID = p.ProductID AND IsPrimary = 1
            ) pi
            WHERE c.CustomerID = @CustomerID
        `);

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post(
    '/',
    [
        body('customerId').isInt({ min: 1 }),
        body('variantId').isInt({ min: 1 }),
        body('quantity').isInt({ min: 1 })
    ],
    validate,
    async (req, res) => {
        try {
            const pool = await getPool();
            const request = pool.request();

            request.input('CustomerID', sql.Int, req.body.customerId);
            request.input('VariantID', sql.Int, req.body.variantId);
            request.input('Quantity', sql.Int, req.body.quantity);

            const query = `
                DECLARE @CartID INT = (SELECT CartID FROM Cart WHERE CustomerID = @CustomerID);
                IF @CartID IS NULL
                BEGIN
                    INSERT INTO Cart (CustomerID) VALUES (@CustomerID);
                    SET @CartID = SCOPE_IDENTITY();
                END;
                EXEC sp_AddOrUpdateCartItem 
                    @CustomerID = @CustomerID,
                    @VariantID = @VariantID,
                    @Quantity = @Quantity;
            `;

            await request.batch(query);
            res.status(200).json({ message: 'Cart updated.' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

router.delete('/:customerId/:variantId', async (req, res) => {
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('CustomerID', sql.Int, req.params.customerId);
        request.input('VariantID', sql.Int, req.params.variantId);

        await request.query(`
            DELETE ci
            FROM CartItem ci
            INNER JOIN Cart c ON c.CartID = ci.CartID
            WHERE c.CustomerID = @CustomerID AND ci.VariantID = @VariantID
        `);

        res.json({ message: 'Item removed from cart.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post(
    '/checkout',
    [
        body('customerId').isInt({ min: 1 }),
        body('addressId').isInt({ min: 1 }),
        body('shippingMethod').optional().isString()
    ],
    validate,
    async (req, res) => {
        try {
            const pool = await getPool();
            const request = pool.request();
            request.input('CustomerID', sql.Int, req.body.customerId);
            request.input('AddressID', sql.Int, req.body.addressId);
            request.input('ShippingMethod', sql.NVarChar(50), req.body.shippingMethod || null);
            request.output('OrderID', sql.Int);

            const result = await request.execute('sp_PlaceOrder');
            const orderId = result.output.OrderID;

            res.status(201).json({ message: 'Order placed.', orderId });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

module.exports = router;

