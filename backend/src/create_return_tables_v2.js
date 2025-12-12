const { getPool, sql } = require('./db');

async function migrate() {
    try {
        const pool = await getPool();
        console.log('Ensuring ReturnRequest tables...');

        await pool.request().query(`
            IF OBJECT_ID('ReturnRequest', 'U') IS NULL
            BEGIN
                CREATE TABLE ReturnRequest (
                    ReturnID INT IDENTITY(1,1) PRIMARY KEY,
                    OrderID INT NOT NULL,
                    RequestType NVARCHAR(20) NOT NULL,
                    Reason NVARCHAR(100) NOT NULL,
                    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
                    ExchangeMode NVARCHAR(20) NULL,
                    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
                    CONSTRAINT FK_Return_Order FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
                    CONSTRAINT CHK_Return_Type CHECK (RequestType IN ('Refund', 'Exchange')),
                    CONSTRAINT CHK_Return_Status CHECK (Status IN ('Pending', 'Approved', 'Rejected', 'Completed'))
                );
                PRINT 'Created ReturnRequest table.';
            END

            IF OBJECT_ID('ReturnRequestItem', 'U') IS NULL
            BEGIN
                CREATE TABLE ReturnRequestItem (
                    ReturnItemID INT IDENTITY(1,1) PRIMARY KEY,
                    ReturnID INT NOT NULL,
                    OrderItemID INT NOT NULL,
                    Quantity INT NOT NULL,
                    ReplacementVariantID INT NULL,
                    CONSTRAINT FK_ReturnItem_Request FOREIGN KEY (ReturnID) REFERENCES ReturnRequest(ReturnID) ON DELETE CASCADE,
                    CONSTRAINT FK_ReturnItem_OrderItem FOREIGN KEY (OrderItemID) REFERENCES OrderItem(OrderItemID)
                );
                PRINT 'Created ReturnRequestItem table.';
            END
        `);

        console.log('Migration completed.');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

migrate();
