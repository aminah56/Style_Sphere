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
        console.log('[Return] Payload:', req.body);
        const { orderId } = req.params;
        const { requestType, reason, exchangeMode, items } = req.body;

        // items: [{ orderItemId: 1, quantity: 1, replacementVariantId: null }]

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            // 1. Create Return Request Header
            const requestResult = await transaction.request()
                .input('OrderID', sql.Int, orderId)
                .input('RequestType', sql.NVarChar, requestType) // 'Refund' or 'Exchange'
                .input('Reason', sql.NVarChar, reason)
                .input('Status', sql.NVarChar, 'Pending')
                .input('ExchangeMode', sql.NVarChar, exchangeMode || null) // 'InStore' or 'Online'
                .query(`
                    INSERT INTO ReturnRequest (OrderID, RequestType, Reason, Status, ExchangeMode)
                    OUTPUT INSERTED.ReturnID
                    VALUES (@OrderID, @RequestType, @Reason, @Status, @ExchangeMode)
                `);

            const returnId = requestResult.recordset[0].ReturnID;

            // 2. Insert Items
            for (const item of items) {
                await transaction.request()
                    .input('ReturnID', sql.Int, returnId)
                    .input('OrderItemID', sql.Int, item.orderItemId)
                    .input('Quantity', sql.Int, item.quantity)
                    .input('ReplacementVariantID', sql.Int, item.replacementVariantId || null)
                    .query(`
                        INSERT INTO ReturnRequestItem (ReturnID, OrderItemID, Quantity, ReplacementVariantID)
                        VALUES (@ReturnID, @OrderItemID, @Quantity, @ReplacementVariantID)
                    `);
            }

            await transaction.commit();

            res.status(201).json({
                message: 'Return request submitted successfully',
                returnId
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Error submitting return request:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

