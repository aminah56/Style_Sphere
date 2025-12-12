const { getPool, sql } = require('./db');

async function checkOrders() {
    try {
        const pool = await getPool();

        console.log('--- Checking Customers ---');
        const customers = await pool.request().query('SELECT TOP 5 CustomerID, CustomerName, Email FROM Customer');
        console.log(JSON.stringify(customers.recordset, null, 2));

        if (customers.recordset.length > 0) {
            const customerId = customers.recordset[0].CustomerID;
            console.log(`\n--- Checking Orders for Customer ${customerId} ---`);
            console.log(`\n--- Running API Query for Customer ${customerId} ---`);
            const result = await pool.request()
                .input('CustomerID', sql.Int, customerId)
                .query(`
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

            console.log('Raw Result Record 1 Items Type:', typeof result.recordset[0]?.Items);
            console.log('Raw Result Record 1 Items Value:', result.recordset[0]?.Items);

            const orders = result.recordset.map(order => ({
                ...order,
                Items: order.Items ? JSON.parse(order.Items) : []
            }));
            console.log('Parsed Order 1:', JSON.stringify(orders[0], null, 2));
        } else {
            console.log('No customers found.');
        }

        console.log('\n--- Checking All Orders (Top 5) ---');
        const allOrders = await pool.request().query('SELECT TOP 5 * FROM Orders');
        console.log(JSON.stringify(allOrders.recordset, null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkOrders();
