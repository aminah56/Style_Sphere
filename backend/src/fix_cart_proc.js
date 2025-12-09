const { sql, getPool } = require('./db');

async function fixCartProc() {
    try {
        const pool = await getPool();
        console.log('Connected to database...');

        console.log('Updating sp_AddOrUpdateCartItem...');
        await pool.request().query(`
            IF OBJECT_ID('sp_AddOrUpdateCartItem', 'P') IS NOT NULL DROP PROCEDURE sp_AddOrUpdateCartItem;
        `);

        await pool.request().query(`
            CREATE PROCEDURE sp_AddOrUpdateCartItem
                @CustomerID INT,
                @VariantID INT,
                @Quantity INT
            AS
            BEGIN
                SET NOCOUNT ON;
                BEGIN TRY
                    BEGIN TRAN;

                    DECLARE @CartID INT = (SELECT CartID FROM Cart WHERE CustomerID = @CustomerID);

                    IF @CartID IS NULL
                    BEGIN
                        INSERT INTO Cart (CustomerID) VALUES (@CustomerID);
                        SET @CartID = SCOPE_IDENTITY();
                    END;

                    DECLARE @AvailableStock INT,
                            @UnitPrice DECIMAL(10,2);

                    SELECT 
                        @AvailableStock = pv.AdditionalStock,
                        @UnitPrice = p.Price
                    FROM ProductVariant pv
                    INNER JOIN Product p ON p.ProductID = pv.ProductID
                    WHERE pv.VariantID = @VariantID;

                    IF @AvailableStock IS NULL
                        THROW 51003, 'Variant not found.', 1;

                    IF @Quantity > @AvailableStock
                        THROW 51004, 'Requested quantity exceeds stock.', 1;

                    IF EXISTS (SELECT 1 FROM CartItem WHERE CartID = @CartID AND VariantID = @VariantID)
                    BEGIN
                        UPDATE CartItem
                        SET Quantity = @Quantity,
                        UnitPrice = @UnitPrice
                    WHERE CartID = @CartID AND VariantID = @VariantID;
                    END
                    ELSE
                    BEGIN
                        INSERT INTO CartItem (CartID, VariantID, Quantity, UnitPrice)
                        VALUES (@CartID, @VariantID, @Quantity, @UnitPrice);
                    END;

                    COMMIT;
                END TRY
                BEGIN CATCH
                    IF @@TRANCOUNT > 0 ROLLBACK;
                    THROW;
                END CATCH
            END;
        `);

        console.log('Procedure updated.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixCartProc();
