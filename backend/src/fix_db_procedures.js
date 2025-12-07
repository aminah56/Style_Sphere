const { sql, getPool } = require('./db');

async function fixProcedures() {
    try {
        const pool = await getPool();
        console.log('Connected to database...');

        // Drop existing procedures
        console.log('Dropping old procedures...');
        await pool.request().query(`
            IF OBJECT_ID('sp_LoginCustomer', 'P') IS NOT NULL DROP PROCEDURE sp_LoginCustomer;
            IF OBJECT_ID('sp_RegisterCustomer', 'P') IS NOT NULL DROP PROCEDURE sp_RegisterCustomer;
        `);

        // Recreate sp_LoginCustomer
        console.log('Creating sp_LoginCustomer...');
        await pool.request().query(`
            CREATE PROCEDURE sp_LoginCustomer
                @Email NVARCHAR(150),
                @PlainPassword NVARCHAR(255)
            AS
            BEGIN
                SET NOCOUNT ON;
                
                DECLARE @CustomerID INT,
                        @Hash VARBINARY(64),
                        @Salt UNIQUEIDENTIFIER;

                SELECT 
                    @CustomerID = CustomerID,
                    @Hash = PasswordHash,
                    @Salt = PasswordSalt
                FROM Customer 
                WHERE Email = @Email;
                
                IF @CustomerID IS NULL
                BEGIN
                    SELECT 'Invalid credentials.' AS Message, 0 AS Success;
                    RETURN;
                END;
                
                DECLARE @ComputedHash VARBINARY(64) = dbo.fn_HashPassword(@PlainPassword, @Salt);

                IF @ComputedHash = @Hash
                BEGIN
                    SELECT 'Login successful.' AS Message,
                        1 AS Success,
                           CustomerID,
                           CustomerName + ' ' + LastName AS FullName,
                           Email
                    FROM Customer
                    WHERE CustomerID = @CustomerID;
                END
                ELSE
                BEGIN
                    SELECT 'Invalid credentials.' AS Message, 0 AS Success;
                END;
            END;
        `);

        // Recreate sp_RegisterCustomer
        console.log('Creating sp_RegisterCustomer...');
        await pool.request().query(`
            CREATE PROCEDURE sp_RegisterCustomer
                @CustomerName NVARCHAR(100),
                @LastName NVARCHAR(100),
                @Email NVARCHAR(150),
                @PlainPassword NVARCHAR(255),
                @PhoneNo NVARCHAR(20),
                @DateOfBirth DATE = NULL,
                @CustomerID INT OUTPUT
            AS
            BEGIN
                SET NOCOUNT ON;
                BEGIN TRY
                    BEGIN TRAN;
                    
                    IF EXISTS (SELECT 1 FROM Customer WHERE Email = @Email)
                    BEGIN
                        THROW 51002, 'Email already registered.', 1;
                    END;
                    
                    DECLARE @Salt UNIQUEIDENTIFIER = NEWID();
                    DECLARE @Hash VARBINARY(64) = dbo.fn_HashPassword(@PlainPassword, @Salt);
                    
                    INSERT INTO Customer (CustomerName, LastName, Email, PasswordHash, PasswordSalt, PhoneNo, DateOfBirth)
                    VALUES (@CustomerName, @LastName, @Email, @Hash, @Salt, @PhoneNo, @DateOfBirth);
                    
                    SET @CustomerID = SCOPE_IDENTITY();
                    
                    INSERT INTO Cart (CustomerID) VALUES (@CustomerID);
                    
                    COMMIT;

                    SELECT 'Customer registered successfully.' AS Message, @CustomerID AS CustomerID;
                END TRY
                BEGIN CATCH
                    IF @@TRANCOUNT > 0 ROLLBACK;
                    THROW;
                END CATCH
            END;
        `);

        console.log('Database procedures updated successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating procedures:', error);
        process.exit(1);
    }
}

fixProcedures();
