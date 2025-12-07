const express = require('express');
const { getPool, sql } = require('../db');

const router = express.Router();

router.get('/customer/:customerId', async (req, res) => {
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('CustomerID', sql.Int, req.params.customerId);

        const result = await request.query(`
            SELECT 
                o.OrderID,
                o.OrderDate,
                o.OrderTotal,
                o.OrderStatus,
                o.ShippingMethod,
                p.PaymentStatus
            FROM Orders o
            LEFT JOIN Payment p ON p.OrderID = o.OrderID
            WHERE o.CustomerID = @CustomerID
            ORDER BY o.OrderDate DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

