const { getPool, sql } = require('./db');

async function seedOrders() {
    try {
        const pool = await getPool();

        // 1. Get a user (using the first one found, assuming that's the one logged in or we can use generic logic)
        // If you know the specific email, you can filter by it. I'll use CustomerID 1 for now.
        const userResult = await pool.request().query("SELECT TOP 1 CustomerID, Email FROM Customer");
        if (userResult.recordset.length === 0) {
            console.log("No customers found. Please register a user first.");
            return;
        }
        const user = userResult.recordset[0];
        console.log(`Creating orders for user: ${user.Email} (ID: ${user.CustomerID})`);

        // 2. Get some products
        const productsResult = await pool.request().query(`
            SELECT TOP 10 
                pv.VariantID, p.ProductID, p.Name, p.Price, s.SizeName, c.ColorName 
            FROM Product p 
            JOIN ProductVariant pv ON p.ProductID = pv.ProductID 
            JOIN Size s ON s.SizeID = pv.SizeID 
            JOIN Color c ON c.ColorID = pv.ColorID
            WHERE p.Status = 'Active'
        `);

        if (productsResult.recordset.length < 3) {
            console.log("Not enough products found to seed orders.");
            return;
        }
        const products = productsResult.recordset;

        // 3. Create Orders
        // Helper to get random int
        const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        // Ensure we have some statuses that allow refunds (Delivered)
        const ordersToCreate = [
            { daysAgo: 5, status: 'Delivered', itemCount: 2 },
            { daysAgo: 12, status: 'Delivered', itemCount: 1 },
            { daysAgo: 2, status: 'Processing', itemCount: 3 } // Maybe one that isn't delivered yet
        ];

        for (const orderSpec of ordersToCreate) {
            const orderDate = new Date();
            orderDate.setDate(orderDate.getDate() - orderSpec.daysAgo);

            // Calculate random total (will update after adding items technically, but we can ballpark or sum up)
            // Let's do a transaction or just insert cleanly.

            // Pick random items
            const orderItems = [];
            let totalAmount = 0;
            for (let i = 0; i < orderSpec.itemCount; i++) {
                const prod = products[randomInt(0, products.length - 1)];
                orderItems.push(prod);
                totalAmount += prod.Price;
            }

            // 1. Get/Create Address
            let addressId;
            const addressRes = await pool.request()
                .input('CustID', sql.Int, user.CustomerID)
                .query("SELECT TOP 1 AddressID FROM Address WHERE CustomerID = @CustID");

            if (addressRes.recordset.length > 0) {
                addressId = addressRes.recordset[0].AddressID;
            } else {
                const addrIns = await pool.request()
                    .input('CustID', sql.Int, user.CustomerID)
                    .query("INSERT INTO Address (CustomerID, Street, City, PostalCode, Country, IsDefault) OUTPUT INSERTED.AddressID VALUES (@CustID, '123 Seed St', 'Lahore', '54000', 'Pakistan', 1)");
                addressId = addrIns.recordset[0].AddressID;
            }

            // 2. Insert Order
            const orderQuery = `
                INSERT INTO Orders (CustomerID, AddressID, OrderDate, OrderTotal, OrderStatus, ShippingMethod)
                OUTPUT INSERTED.OrderID
                VALUES (@CustomerID, @AddressID, @OrderDate, @TotalAmount, @Status, @ShippingMethod)
            `;

            const orderReq = pool.request()
                .input('CustomerID', sql.Int, user.CustomerID)
                .input('AddressID', sql.Int, addressId)
                .input('OrderDate', sql.DateTime, orderDate)
                .input('TotalAmount', sql.Decimal(10, 2), totalAmount)
                .input('Status', sql.NVarChar, orderSpec.status)
                .input('ShippingMethod', sql.NVarChar, 'Standard');

            const orderRes = await orderReq.query(orderQuery);
            const orderId = orderRes.recordset[0].OrderID;

            console.log(`Created Order #${orderId} - ${orderSpec.status} - ${orderDate.toISOString().split('T')[0]}`);

            // 3. Insert Payment
            await pool.request()
                .input('OrderID', sql.Int, orderId)
                .input('Amount', sql.Decimal(10, 2), totalAmount)
                .query(`
                    INSERT INTO Payment (OrderID, PaymentMethod, PaymentAmount, PaymentStatus)
                    VALUES (@OrderID, 'COD', @Amount, 'Pending')
                `);

            // 4. Insert Order Items
            for (const item of orderItems) {
                await pool.request()
                    .input('OrderID', sql.Int, orderId)
                    .input('VariantID', sql.Int, item.VariantID)
                    .input('Quantity', sql.Int, 1)
                    .input('Price', sql.Decimal(10, 2), item.Price)
                    .query(`
                        INSERT INTO OrderItem (OrderID, VariantID, Quantity, UnitPrice)
                        VALUES (@OrderID, @VariantID, @Quantity, @Price)
                    `);
            }
        }

        console.log("Seed completed successfully!");

    } catch (err) {
        console.error("Error seeding orders:", err);
    }
}

seedOrders();
