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
                p.PaymentStatus,
                (
                    SELECT 
                        oi.OrderItemID,
                        oi.Quantity,
                        oi.UnitPrice AS Price,
                        prod.Name,
                        prod.ProductID,
                        s.SizeName AS Size,
                        c.ColorName AS Color,
                        pv.VariantID,
                        (SELECT TOP 1 ImageURL FROM ProductImage img WHERE img.ProductID = prod.ProductID ORDER BY IsPrimary DESC) AS ImageURL
                    FROM OrderItem oi
                    INNER JOIN ProductVariant pv ON oi.VariantID = pv.VariantID
                    INNER JOIN Product prod ON pv.ProductID = prod.ProductID
                    INNER JOIN Size s ON pv.SizeID = s.SizeID
                    INNER JOIN Color c ON pv.ColorID = c.ColorID
                    WHERE oi.OrderID = o.OrderID
                    FOR JSON PATH
                ) AS Items
            FROM Orders o
            LEFT JOIN Payment p ON p.OrderID = o.OrderID
            WHERE o.CustomerID = @CustomerID
            ORDER BY o.OrderDate DESC
        `);

        // Parse Items JSON string if necessary
        const orders = result.recordset.map(order => ({
            ...order,
            Items: order.Items ? JSON.parse(order.Items) : []
        }));

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/:orderId/return', async (req, res) => {
    try {
        console.log('[Return] Processing return request for Order:', req.params.orderId);
        const { orderId } = req.params;
        const { requestType } = req.body; // Expect 'Refunded' or 'Exchanged' (Exact match to DB status)

        // Map frontend terms to DB statuses if needed, but assuming frontend sends 'Refunded' or 'Exchanged'
        // or frontend sends 'Refund'/'Exchange' and we map.
        let dbStatus = requestType;
        if (requestType === 'Refund') dbStatus = 'Refunded';
        else if (requestType === 'Exchange') dbStatus = 'Exchanged';

        const pool = await getPool();
        const request = pool.request();

        request.input('OrderID', sql.Int, orderId);
        request.input('RequestType', sql.NVarChar(20), dbStatus);

        // Execute Stoed Procedure which contains the logic:
        // 1. Checks if OrderStatus is 'Delivered'. Throws if not.
        // 2. Checks if already 'Refunded'/'Exchanged' -> Throws.
        // 3. Updates status and restocks.
        try {
            await request.execute('sp_ProcessOrderReturn');
            res.json({ message: `Order marked as ${dbStatus} successfully.` });

        } catch (sqlErr) {
            // SQL errors (THROW 51xxx) come here.
            // Check for our custom error codes or message
            console.error('SQL Error during return:', sqlErr);

            if (sqlErr.number >= 51000) {
                return res.status(400).json({ message: sqlErr.message });
            }
            throw sqlErr;
        }

    } catch (error) {
        console.error('Error submitting return request:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

