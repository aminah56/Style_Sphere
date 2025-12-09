-- ==============================================================
-- StyleSphere E-Commerce Database (Simplified & Front-End Ready)
-- Target Platform  : Microsoft SQL Server
-- Scope            : Eastern apparel store for men & women
-- Requirements     :
--   * Clean hierarchy for stitched/unstitched collections
--   * Secure customer auth (hash + salt) with register/login procs
--   * Minimal, logical schema ready for frontend APIs
--   * Essential triggers to keep stock and carts consistent
-- ============================================================== 

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = 'StyleSphere')
BEGIN
    CREATE DATABASE StyleSphere;
END;
GO

USE StyleSphere;
GO



-- ==============================================================
-- DROP OBJECTS (re-runnable script)
-- ==============================================================
IF OBJECT_ID('Payment', 'U') IS NOT NULL DROP TABLE Payment;
IF OBJECT_ID('OrderItem', 'U') IS NOT NULL DROP TABLE OrderItem;
IF OBJECT_ID('Orders', 'U') IS NOT NULL DROP TABLE Orders;
IF OBJECT_ID('CartItem', 'U') IS NOT NULL DROP TABLE CartItem;
IF OBJECT_ID('Cart', 'U') IS NOT NULL DROP TABLE Cart;
IF OBJECT_ID('Wishlist', 'U') IS NOT NULL DROP TABLE Wishlist;
IF OBJECT_ID('ProductImage', 'U') IS NOT NULL DROP TABLE ProductImage;
IF OBJECT_ID('ProductVariant', 'U') IS NOT NULL DROP TABLE ProductVariant;
IF OBJECT_ID('Product', 'U') IS NOT NULL DROP TABLE Product;
IF OBJECT_ID('Category', 'U') IS NOT NULL DROP TABLE Category;
IF OBJECT_ID('Size', 'U') IS NOT NULL DROP TABLE Size;
IF OBJECT_ID('Color', 'U') IS NOT NULL DROP TABLE Color;
IF OBJECT_ID('Address', 'U') IS NOT NULL DROP TABLE Address;
IF OBJECT_ID('Customer', 'U') IS NOT NULL DROP TABLE Customer;
GO

-- ==============================================================
-- TABLES
-- ==============================================================

CREATE TABLE Customer (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    PasswordHash VARBINARY(64) NOT NULL,
    PasswordSalt UNIQUEIDENTIFIER NOT NULL,
    PhoneNo NVARCHAR(20) NOT NULL,
    DateOfBirth DATE NULL,
    ProfilePicture NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CHK_Customer_Email CHECK (Email LIKE '%_@__%.__%')
);
GO

CREATE TABLE Address (
    AddressID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NOT NULL,
    Street NVARCHAR(200) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    PostalCode NVARCHAR(20) NOT NULL,
    Country NVARCHAR(100) NOT NULL,
    IsDefault BIT DEFAULT 0,
    CONSTRAINT FK_Address_Customer FOREIGN KEY (CustomerID) 
        REFERENCES Customer(CustomerID) ON DELETE CASCADE
);
GO

CREATE TABLE Category (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL,
    ParentCategoryID INT NULL,
    Description NVARCHAR(300) NULL,
    CONSTRAINT FK_Category_Parent FOREIGN KEY (ParentCategoryID) 
        REFERENCES Category(CategoryID)
);
GO

CREATE TABLE Size (
    SizeID INT IDENTITY(1,1) PRIMARY KEY,
    SizeName NVARCHAR(20) NOT NULL UNIQUE
);
GO

CREATE TABLE Color (
    ColorID INT IDENTITY(1,1) PRIMARY KEY,
    ColorName NVARCHAR(50) NOT NULL UNIQUE,
    HexCode CHAR(7) NULL
);
GO

CREATE TABLE Product (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryID INT NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(800) NULL,
    Price DECIMAL(10,2) NOT NULL,
    TotalStock INT NOT NULL DEFAULT 0,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
    DateAdded DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT CHK_Product_Price CHECK (Price >= 0),
    CONSTRAINT CHK_Product_Status CHECK (Status IN ('Active','Inactive')),
    CONSTRAINT FK_Product_Category FOREIGN KEY (CategoryID) 
        REFERENCES Category(CategoryID)
);
GO

CREATE TABLE ProductVariant (
    VariantID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    SizeID INT NOT NULL,
    ColorID INT NOT NULL,
    SKU NVARCHAR(50) NOT NULL UNIQUE,
    AdditionalStock INT NOT NULL DEFAULT 0,
    CONSTRAINT FK_Variant_Product FOREIGN KEY (ProductID) 
        REFERENCES Product(ProductID) ON DELETE CASCADE,
    CONSTRAINT FK_Variant_Size FOREIGN KEY (SizeID) 
        REFERENCES Size(SizeID),
    CONSTRAINT FK_Variant_Color FOREIGN KEY (ColorID) 
        REFERENCES Color(ColorID),
    CONSTRAINT CHK_Variant_Stock CHECK (AdditionalStock >= 0),
    CONSTRAINT UQ_Variant_Combination UNIQUE (ProductID, SizeID, ColorID)
);
GO

CREATE TABLE ProductImage (
    ImageID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    ImageURL NVARCHAR(500) NOT NULL,
    IsPrimary BIT DEFAULT 0,
    DisplayOrder INT DEFAULT 0,
    CONSTRAINT FK_ProductImage_Product FOREIGN KEY (ProductID)
        REFERENCES Product(ProductID) ON DELETE CASCADE
);
GO

CREATE TABLE Wishlist (
    WishlistID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NOT NULL,
    ProductID INT NOT NULL,
    AddedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Wishlist_Customer FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID) ON DELETE CASCADE,
    CONSTRAINT FK_Wishlist_Product FOREIGN KEY (ProductID)
        REFERENCES Product(ProductID) ON DELETE CASCADE,
    CONSTRAINT UQ_Wishlist UNIQUE (CustomerID, ProductID)
);
GO

CREATE TABLE Cart (
    CartID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NOT NULL UNIQUE,
    CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_Cart_Customer FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID) ON DELETE CASCADE
);
GO

CREATE TABLE CartItem (
    CartItemID INT IDENTITY(1,1) PRIMARY KEY,
    CartID INT NOT NULL,
    VariantID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    Subtotal AS (Quantity * UnitPrice) PERSISTED,
    AddedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_CartItem_Cart FOREIGN KEY (CartID) 
        REFERENCES Cart(CartID) ON DELETE CASCADE,
    CONSTRAINT FK_CartItem_Variant FOREIGN KEY (VariantID) 
        REFERENCES ProductVariant(VariantID),
    CONSTRAINT UQ_CartItem UNIQUE (CartID, VariantID),
    CONSTRAINT CHK_CartItem_Qty CHECK (Quantity > 0),
    CONSTRAINT CHK_CartItem_Price CHECK (UnitPrice >= 0)
);
GO

CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NOT NULL,
    AddressID INT NOT NULL,
    OrderDate DATETIME2 DEFAULT SYSUTCDATETIME(),
    OrderTotal DECIMAL(10,2) NOT NULL,
    OrderStatus NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    ShippingMethod NVARCHAR(50) NULL,
    TrackingNumber NVARCHAR(100) NULL,
    CONSTRAINT FK_Orders_Customer FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID),
    CONSTRAINT FK_Orders_Address FOREIGN KEY (AddressID)
        REFERENCES Address(AddressID),
    CONSTRAINT CHK_Order_Total CHECK (OrderTotal >= 0),
    CONSTRAINT CHK_Order_Status CHECK (OrderStatus IN ('Pending','Processing','Shipped','Delivered','Cancelled'))
);
GO

CREATE TABLE OrderItem (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    VariantID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    Subtotal AS (Quantity * UnitPrice) PERSISTED,
    CONSTRAINT FK_OrderItem_Order FOREIGN KEY (OrderID) 
        REFERENCES Orders(OrderID) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItem_Variant FOREIGN KEY (VariantID) 
        REFERENCES ProductVariant(VariantID),
    CONSTRAINT CHK_OrderItem_Qty CHECK (Quantity > 0),
    CONSTRAINT CHK_OrderItem_Price CHECK (UnitPrice >= 0)
);
GO

CREATE TABLE Payment (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL UNIQUE,
    PaymentMethod NVARCHAR(30) NOT NULL,
    PaymentAmount DECIMAL(10,2) NOT NULL,
    PaymentDate DATETIME2 DEFAULT SYSUTCDATETIME(),
    PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'Pending',
    TransactionID NVARCHAR(100) NULL,
    CardLast4Digits CHAR(4) NULL,
    CONSTRAINT FK_Payment_Order FOREIGN KEY (OrderID) 
        REFERENCES Orders(OrderID) ON DELETE CASCADE,
    CONSTRAINT CHK_Payment_Amount CHECK (PaymentAmount >= 0),
    CONSTRAINT CHK_Payment_Status CHECK (PaymentStatus IN ('Pending','Completed','Failed','Refunded')),
    CONSTRAINT CHK_Payment_Method CHECK (PaymentMethod IN ('Credit Card','Debit Card','COD','Bank Transfer'))
);
GO

-- ==============================================================
-- INDEXES
-- ==============================================================
CREATE NONCLUSTERED INDEX IX_Customer_Email ON Customer(Email);
CREATE NONCLUSTERED INDEX IX_Product_Category ON Product(CategoryID);
CREATE NONCLUSTERED INDEX IX_Product_Status ON Product(Status);
CREATE NONCLUSTERED INDEX IX_ProductVariant_SKU ON ProductVariant(SKU);
CREATE NONCLUSTERED INDEX IX_Orders_Customer ON Orders(CustomerID);
GO

-- ==============================================================
-- TRIGGERS
-- ==============================================================

CREATE TRIGGER trg_ProductVariant_UpdateTotalStock
ON ProductVariant
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @AffectedProducts TABLE (ProductID INT PRIMARY KEY);

    INSERT INTO @AffectedProducts(ProductID)
    SELECT DISTINCT ProductID FROM inserted
    UNION
    SELECT DISTINCT ProductID FROM deleted;

    UPDATE p
    SET TotalStock = ISNULL(v.TotalStock, 0)
    FROM Product p
    CROSS APPLY (
        SELECT SUM(AdditionalStock) AS TotalStock
        FROM ProductVariant pv
        WHERE pv.ProductID = p.ProductID
    ) v
    WHERE p.ProductID IN (SELECT ProductID FROM @AffectedProducts);
END;
GO

CREATE TRIGGER trg_CartItem_ValidateStock
ON CartItem
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN ProductVariant pv ON pv.VariantID = i.VariantID
        WHERE i.Quantity > pv.AdditionalStock
    )
    BEGIN
        THROW 51001, 'Insufficient stock for the selected size/color.', 1;
    END;
END;
GO

CREATE TRIGGER trg_Cart_UpdateTimestamp
ON CartItem
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE c
    SET UpdatedAt = SYSUTCDATETIME()
    FROM Cart c
    WHERE c.CartID IN (
        SELECT DISTINCT CartID FROM inserted
        UNION
        SELECT DISTINCT CartID FROM deleted
    );
END;
GO

-- ==============================================================
-- PASSWORD HASHING FUNCTION
-- ==============================================================
CREATE FUNCTION fn_HashPassword
(
    @PlainPassword NVARCHAR(255),
    @Salt UNIQUEIDENTIFIER
)
RETURNS VARBINARY(64)
AS
BEGIN
    RETURN HASHBYTES('SHA2_256', CONCAT(@PlainPassword, CONVERT(NVARCHAR(36), @Salt)));
END;
GO

-- ==============================================================
-- STORED PROCEDURES (AUTH + CORE FLOWS)
-- ==============================================================

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
GO

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
GO

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
GO

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

        DECLARE @OrderTotal DECIMAL(10,2) = (
            SELECT SUM(Subtotal) FROM CartItem WHERE CartID = @CartID
        );

        INSERT INTO Orders (CustomerID, AddressID, OrderTotal, ShippingMethod, OrderStatus)
        VALUES (@CustomerID, @AddressID, @OrderTotal, @ShippingMethod, 'Pending');

        SET @OrderID = SCOPE_IDENTITY();

        INSERT INTO OrderItem (OrderID, VariantID, Quantity, UnitPrice)
        SELECT @OrderID, VariantID, Quantity, UnitPrice
        FROM CartItem
        WHERE CartID = @CartID;

        UPDATE pv
        SET AdditionalStock = pv.AdditionalStock - ci.Quantity
        FROM ProductVariant pv
        INNER JOIN CartItem ci ON ci.VariantID = pv.VariantID
        WHERE ci.CartID = @CartID;

        DELETE FROM CartItem WHERE CartID = @CartID;

        COMMIT;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK;
        THROW;
    END CATCH
END;
GO

-- ==============================================================
-- REFERENCE DATA (HIERARCHY + LOOKUPS)
-- ==============================================================

INSERT INTO Category (CategoryName, ParentCategoryID, Description)
VALUES 
    ('Men''s Collection', NULL, 'Complete range of men''s eastern wear'),
    ('Women''s Collection', NULL, 'Complete range of women''s eastern wear'),
    ('Men''s Stitched', 1, 'Ready to wear sets for men'),
    ('Men''s Unstitched', 1, 'Fabric only for men'),
    ('Women''s Stitched', 2, 'Ready to wear sets for women'),
    ('Women''s Unstitched', 2, 'Fabric only for women'),
    ('Men''s Casual', 3, 'Everyday wear'),
    ('Men''s Formal', 3, 'Occasions & events'),
    ('Men''s Luxury Pret', 3, 'Premium designer looks'),
    ('Men''s Casual Unstitched', 4, 'Casual fabrics'),
    ('Men''s Formal Unstitched', 4, 'Formal fabrics'),
    ('Women''s Casual', 5, 'Daily wear'),
    ('Women''s Formal', 5, 'Occasions & events'),
    ('Women''s Luxury Pret', 5, 'Premium designer'),
    ('Women''s Casual Unstitched', 6, 'Casual fabrics'),
    ('Women''s Formal Unstitched', 6, 'Formal fabrics');
GO

INSERT INTO Size (SizeName)
VALUES ('XS'), ('S'), ('M'), ('L'), ('XL'), ('XXL'), ('FreeSize');
GO

INSERT INTO Color (ColorName, HexCode)
VALUES 
    ('White', '#FFFFFF'),
    ('Black', '#000000'),
    ('Beige', '#F5F5DC'),
    ('Maroon', '#800000'),
    ('Emerald Green', '#50C878'),
    ('Royal Blue', '#4169E1'),
    ('Mustard', '#FFDB58'),
    ('Blush Pink', '#FFC0CB'),
    ('Champagne', '#FAD6A5'),
    ('Teal', '#008080');
GO

-- ==============================================================
-- PRODUCT CATALOG (MEN & WOMEN)
-- ==============================================================

INSERT INTO Product (CategoryID, Name, Description, Price)
VALUES 
    (7,  'Cotton Kurta Set', 'Breathable cotton kurta shalwar for daily wear.', 3499.00),
    (7,  'Summer Lawn Kurta', 'Lightweight lawn kurta perfect for daytime outings.', 2999.00),
    (8,  'Embroidered Kurta Waistcoat', 'Formal kurta waistcoat combo with intricate embroidery.', 8999.00),
    (8,  'Classic Prince Coat', 'Structured prince coat for special events.', 15999.00),
    (9,  'Silk Sherwani', 'Premium silk sherwani with handcrafted details.', 24999.00),
    (10, 'Everyday Cotton Fabric', '5 meter cotton fabric for casual stitching.', 1999.00),
    (11, 'Jamawar Fabric Pack', 'Luxury jamawar fabric for formal tailoring.', 4499.00),
    (12, 'Printed Lawn 2 Piece', 'Printed kurta with trousers for women.', 3999.00),
    (13, 'Chiffon Embroidered Suit', 'Formal chiffon 3-piece with embellishments.', 11999.00),
    (14, 'Bridal Luxury Pret', 'Premium bridal-ready luxury pret ensemble.', 29999.00),
    (15, 'Lawn 3 Piece Unstitched', 'Printed lawn fabric set for home tailoring.', 3499.00),
    (16, 'Organza Embroidered Fabric', 'Organza fabric with detailed embroidery.', 9999.00);
GO

INSERT INTO ProductVariant (ProductID, SizeID, ColorID, SKU, AdditionalStock)
VALUES 
    (1, 3, 1, 'MCS-M-WHT-001', 25),
    (1, 4, 2, 'MCS-L-BLK-001', 20),
    (2, 3, 7, 'SLK-M-MUS-001', 22),
    (2, 4, 3, 'SLK-L-BGE-001', 18),
    (3, 3, 4, 'MFW-M-MAR-001', 15),
    (3, 4, 6, 'MFW-L-BLU-001', 12),
    (4, 4, 2, 'MPC-L-BLK-001', 10),
    (4, 5, 9, 'MPC-XL-CHP-001', 8),
    (5, 4, 9, 'MSH-L-CHP-001', 6),
    (5, 5, 4, 'MSH-XL-MAR-001', 5),
    (6, 7, 3, 'MCU-FS-BGE-001', 40),
    (7, 7, 4, 'MFU-FS-MAR-001', 30),
    (8, 2, 8, 'WLC-S-PNK-001', 28),
    (8, 3, 5, 'WLC-M-GRN-001', 26),
    (9, 3, 4, 'WFS-M-MAR-001', 12),
    (9, 4, 6, 'WFS-L-BLU-001', 10),
    (10, 3, 9, 'WLP-M-CHP-001', 6),
    (11, 7, 7, 'WCU-FS-MUS-001', 32),
    (12, 7, 9, 'WFU-FS-CHP-001', 20);
GO

INSERT INTO ProductImage (ProductID, ImageURL, IsPrimary, DisplayOrder)
VALUES 
    (1,  '/images/products/mens-cotton-kurta.jpg', 1, 1),
    (2,  '/images/products/mens-summer-lawn-kurta.jpg', 1, 1),
    (3,  '/images/products/mens-embroidered-waistcoat.jpg', 1, 1),
    (4,  '/images/products/mens-prince-coat.jpg', 1, 1),
    (5,  '/images/products/mens-silk-sherwani.jpg', 1, 1),
    (8,  '/images/products/womens-printed-lawn.jpg', 1, 1),
    (9,  '/images/products/womens-chiffon-formal.jpg', 1, 1),
    (10, '/images/products/womens-bridal-luxury.jpg', 1, 1),
    (11, '/images/products/womens-lawn-unstitched.jpg', 1, 1),
    (12, '/images/products/womens-organza-fabric.jpg', 1, 1);
GO

-- ==============================================================
-- SAMPLE CUSTOMERS + DATA VIA PROCEDURES
-- ==============================================================

DECLARE @CustomerID_1 INT, @CustomerID_2 INT, @CustomerID_7 int;




EXEC sp_RegisterCustomer
    @CustomerName = 'Ahmed',
    @LastName = 'Khan',
    @Email = 'ahmed.khan@email.com',
    @PlainPassword = 'Ahmed123!',
    @PhoneNo = '+92-300-1234567',
    @DateOfBirth = '1995-05-15',
    @CustomerID = @CustomerID_1 OUTPUT;

EXEC sp_RegisterCustomer
    @CustomerName = 'Fatima',
    @LastName = 'Ali',
    @Email = 'fatima.ali@email.com',
    @PlainPassword = 'Fatima123!',
    @PhoneNo = '+92-321-7654321',
    @DateOfBirth = '1998-08-22',
    @CustomerID = @CustomerID_2 OUTPUT;

INSERT INTO Address (CustomerID, Street, City, PostalCode, Country, IsDefault)
VALUES
    (@CustomerID_1, 'House 123, DHA Phase 5', 'Lahore', '54000', 'Pakistan', 1),
    (@CustomerID_2, 'Street 7, F8 Markaz', 'Islamabad', '44000', 'Pakistan', 1);

-- Add cart items for demo customers
DECLARE @VariantCottonKurta INT = (SELECT VariantID FROM ProductVariant WHERE SKU = 'MCS-M-WHT-001');
DECLARE @VariantChiffonSuit INT = (SELECT VariantID FROM ProductVariant WHERE SKU = 'WFS-M-MAR-001');

EXEC sp_AddOrUpdateCartItem @CustomerID = @CustomerID_1, @VariantID = @VariantCottonKurta, @Quantity = 1;
EXEC sp_AddOrUpdateCartItem @CustomerID = @CustomerID_2, @VariantID = @VariantChiffonSuit, @Quantity = 1;

-- Place a sample order for Fatima
DECLARE @OrderID_Out INT;
DECLARE @AddressFatima INT = (SELECT AddressID FROM Address WHERE CustomerID = @CustomerID_2 AND IsDefault = 1);
EXEC sp_PlaceOrder
    @CustomerID = @CustomerID_2,
    @AddressID = @AddressFatima,
    @ShippingMethod = 'Standard',
    @OrderID = @OrderID_Out OUTPUT;

INSERT INTO Payment (OrderID, PaymentMethod, PaymentAmount, PaymentStatus, TransactionID, CardLast4Digits)
SELECT @OrderID_Out, 'Credit Card', OrderTotal, 'Completed', CONCAT('TXN-', @OrderID_Out), '4242'
FROM Orders
WHERE OrderID = @OrderID_Out;

-- Wishlist examples for frontend widgets
INSERT INTO Wishlist (CustomerID, ProductID)
VALUES
    (@CustomerID_1, 10),
    (@CustomerID_2, 5);



  
