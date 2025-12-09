
const { sql, getPool } = require('./db');

async function updatePlaceOrderProc() {
    try {
        const pool = await getPool();
        console.log('Connected to database...');

        console.log('Updating sp_PlaceOrder...');
        await pool.request().query(`
            IF OBJECT_ID('sp_PlaceOrder', 'P') IS NOT NULL DROP PROCEDURE sp_PlaceOrder;
        `);

        await pool.request().query(`
            CREATE PROCEDURE sp_PlaceOrder
                @CustomerID INT,
                @AddressID INT,
                @ShippingMethod NVARCHAR(50) = NULL,
                @OrderID INT OUTPUT
            AS
            BEGIN
                SET NOCOUNT ON;
                BEGIN TRY
                    BEGIN TRAN;

                    DECLARE @CartID INT = (SELECT CartID FROM Cart WHERE CustomerID = @CustomerID);
                    IF @CartID IS NULL THROW 51005, 'Cart not found for customer.', 1;

                    IF NOT EXISTS (SELECT 1 FROM CartItem WHERE CartID = @CartID)
                        THROW 51006, 'Cart is empty.', 1;

                    IF NOT EXISTS (SELECT 1 FROM Address WHERE AddressID = @AddressID AND CustomerID = @CustomerID)
                        THROW 51007, 'Address not valid for this customer.', 1;

                    -- Calculate Subtotal
                    DECLARE @Subtotal DECIMAL(10,2) = (
                        SELECT SUM(Subtotal) FROM CartItem WHERE CartID = @CartID
                    );

                    -- Determine Shipping Cost
                    DECLARE @ShippingCost DECIMAL(10,2) = 0;
                    IF @ShippingMethod = 'Express'
                        SET @ShippingCost = 300.00;
                    ELSE
                        SET @ShippingCost = 150.00;

                    DECLARE @OrderTotal DECIMAL(10,2) = @Subtotal + @ShippingCost;

                    INSERT INTO Orders (CustomerID, AddressID, OrderTotal, ShippingMethod, OrderStatus)
                    VALUES (@CustomerID, @AddressID, @OrderTotal, @ShippingMethod, 'Pending');

                    SET @OrderID = SCOPE_IDENTITY();

                    INSERT INTO OrderItem (OrderID, VariantID, Quantity, UnitPrice)
                    SELECT @OrderID, VariantID, Quantity, UnitPrice
                    FROM CartItem
                    WHERE CartID = @CartID;

                    -- Update Stock
                    UPDATE pv
                    SET AdditionalStock = pv.AdditionalStock - ci.Quantity
                    FROM ProductVariant pv
                    INNER JOIN CartItem ci ON ci.VariantID = pv.VariantID
                    WHERE ci.CartID = @CartID;

                    -- Remove purchased items from Wishlist
                    DELETE w 
                    FROM Wishlist w
                    INNER JOIN ProductVariant pv ON pv.ProductID = w.ProductID
                    INNER JOIN CartItem ci ON ci.VariantID = pv.VariantID
                    WHERE w.CustomerID = @CustomerID AND ci.CartID = @CartID;

                    -- Clear Cart
                    DELETE FROM CartItem WHERE CartID = @CartID;

                    COMMIT;
                END TRY
                BEGIN CATCH
                    IF @@TRANCOUNT > 0 ROLLBACK;
                    THROW;
                END CATCH
            END;
        `);

        console.log('sp_PlaceOrder updated successfully.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

updatePlaceOrderProc();
