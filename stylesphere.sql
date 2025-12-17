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
    ('Men''s Collection', NULL, 'Complete range of men''s eastern wear'),--1
    ('Women''s Collection', NULL, 'Complete range of women''s eastern wear'),--2
    ('Men''s Stitched', 1, 'Ready to wear sets for men'),--3
    ('Men''s Unstitched', 1, 'Fabric only for men'),--4
    ('Women''s Stitched', 2, 'Ready to wear sets for women'),--5
    ('Women''s Unstitched', 2, 'Fabric only for women'),--6
    ('Men''s Casual', 3, 'Everyday wear'),--7
    ('Men''s Formal', 3, 'Occasions & events'),--8
    ('Men''s Luxury Pret', 3, 'Premium designer looks'),--9
    ('Men''s Casual Unstitched', 4, 'Casual fabrics'),--10
    ('Men''s Formal Unstitched', 4, 'Formal fabrics'),--11
    ('Women''s Casual', 5, 'Daily wear'),--12
    ('Women''s Formal', 5, 'Occasions & events'),--13
    ('Women''s Luxury Pret', 5, 'Premium designer'),--14
    ('Women''s Casual Unstitched', 6, 'Casual fabrics'),--15
    ('Women''s Formal Unstitched', 6, 'Formal fabrics');--16
GO

INSERT INTO Size (SizeName)
VALUES  ('S'), ('M'), ('L'),  ('FreeSize');
GO

INSERT INTO Color (ColorName, HexCode)
VALUES 
    ('White', '#FFFFFF'),--1
    ('Black', '#000000'),--2
    ('Beige', '#F5F5DC'),--3
    ('Maroon', '#800000'),--4
    ('Emerald Green', '#065312'),--5
    ('Royal Blue', '#4169E1'),--6
    ('Mustard', '#FFDB58'),--7
    ('Blush Pink', '#FFC0CB'),--8
    ('Champagne', '#FAD6A5'),--9
    ('Teal', '#949494'),--10
    ('Brown','#867132');--11
GO

-- ==============================================================
-- PRODUCT CATALOG (MEN & WOMEN)
-- ==============================================================

INSERT INTO Product (CategoryID, Name, Description, Price)
VALUES 
    (7,  'Cotton Kurta Set', 'Breathable cotton kurta shalwar for daily wear.', 3499.00),--3
    (7,  'Summer Lawn Kurta', 'Lightweight lawn kurta perfect for daytime outings.', 2999.00),--4
    (8,  'Embroidered Kurta Waistcoat', 'Formal kurta waistcoat combo with intricate embroidery.', 8999.00),--5
    (8,  'Classic Prince Coat', 'Structured prince coat for special events.', 15999.00),--6
    (9,  'Silk Sherwani', 'Premium silk sherwani with handcrafted details.', 24999.00),--7
    (10, 'Everyday Cotton Fabric', '5 meter cotton fabric for casual stitching.', 1999.00),--8
    (11, 'Jamawar Pack', 'Luxury jamawar fabric for formal tailoring.', 4499.00),--9
    (12, 'Printed Lawn 2 Piece', 'Printed kurta with trousers for women.', 3999.00),--10
    (13, '2P Chiffon Embroidered Suit', 'Formal chiffon 2-piece with embellishments.', 11999.00),--11
    (14, 'Bridal Luxury Pret', 'Premium bridal-ready luxury pret ensemble.', 29999.00),--12
    (15, 'Lawn 3 Piece Unstitched', 'Printed lawn fabric set for home tailoring.', 3499.00),--13
    (16, 'Organza Embroidered Fabric', 'Organza fabric with detailed embroidery.', 9999.00), --14
     (7,  'Winter Khaddar Kurta', 'Warm khaddar kurta ideal for winter wear.', 4999.00), ---15
    (8,  'Embroidered Velvet Waistcoat', 'Velvet waistcoat with traditional embroidery.', 10999.00),--16
    (9,  'Royal Jamawar Sherwani', 'Traditional jamawar sherwani for weddings.', 28999.00),--17
    (10, 'Premium Linen Fabric', '5 meter breathable linen fabric.', 2499.00),  --18
    (11, 'Raw Silk Fabric Pack', 'High-quality raw silk for formal tailoring.', 5999.00), --19
    (12, 'Cambric 2 Piece Suit', 'Soft cambric kurta and trousers set.', 4599.00),--20
    (13, 'Velvet Embroidered Suit', 'Luxury velvet 3-piece for winter events.', 13999.00), --21
    (14, 'Formal Luxury Pret', 'Elegant luxury pret for formal occasions.', 18999.00), --22
    (15, 'Khaddar 3 Piece Unstitched', 'Winter khaddar fabric set.', 5499.00), --23
    (16, 'Net Embroidered Fabric', 'Delicate net fabric with embroidery.', 8999.00), --24
   (7,  'Classic Cotton Kurta Set', 'Soft breathable cotton kurta shalwar suitable for everyday comfort.', 3699.00), --25
(7,  'Printed Summer Lawn Kurta', 'Lightweight printed lawn kurta ideal for warm daytime wear.', 3199.00),--26
(8,  'Embroidered Kurta Waistcoat Set', 'Elegant kurta with embroidered waistcoat for formal occasions.', 9299.00), --27
(8,  'Traditional Prince Coat', 'Well-tailored prince coat designed for weddings and formal events.', 16499.00), --28
(9,  'Luxury Silk Sherwani', 'Premium quality silk sherwani with fine handcrafted detailing.', 25499.00),--29
(10, 'Daily Wear Cotton Fabric', '5 meter cotton fabric designed for casual stitched outfits.', 2099.00),  --30
(11, 'Premium Jamawar Fabric Pack', 'Rich jamawar fabric suitable for formal and festive tailoring.', 4699.00), --31
(12, 'Printed Lawn 2 Piece Suit', 'Stylish printed lawn kurta paired with matching trousers.', 4199.00), --32
(13, 'Embroidered Suit', 'Formal 3-piece suit featuring delicate embroidery.', 12399.00), --33
(14, 'Bridal Luxury Pret Ensemble', 'Designer luxury pret outfit crafted for bridal and festive wear.', 30499.00),--34
(15, 'Lawn 3 Piece Unstitched Set', 'Printed lawn unstitched fabric set for custom tailoring.', 3699.00),--35
(16, 'Organza Embroidered Fabric', 'Fine organza fabric enhanced with elegant embroidered patterns.', 10399.00), --36
(7,  'Winter Khaddar Kurta Set', 'Warm khaddar kurta designed for comfortable winter wear.', 5199.00),--37
(8,  'Velvet Embroidered Waistcoat', 'Premium velvet waistcoat featuring traditional embroidery.', 11399.00),--38
(9,  'Royal Jamawar Silk Sherwani', 'Traditional jamawar sherwani ideal for wedding ceremonies.', 29499.00), --39
(10, 'Premium Linen Fabric Pack', '5 meter high-quality linen fabric offering breathability and comfort.', 2699.00),--40
(11, 'Raw Silk Fabric Collection', 'Superior raw silk fabric designed for formal stitched outfits.', 6299.00), --41
(12, 'Cambric 2 Piece Suit', 'Soft cambric kurta with trousers for semi-formal daily wear.', 4799.00), --42
(13, ' Embroidered Winter Suit', 'Luxury 3-piece suit crafted for winter occasions.', 14499.00),--43
(14, 'Elegant Luxury Pret Outfit', 'Refined luxury pret designed for formal evening events.', 19499.00),--44
(15, 'Khaddar 3 Piece Unstitched Set', 'Winter khaddar fabric set ideal for custom tailoring.', 5799.00),--45
(16, 'Net Embroidered Fabric', 'Delicate net fabric featuring detailed embroidery work.', 9299.00), --46
 (12, 'Printed Lawn cord set', 'Printed kurta with trousers for women.', 4050.00),--47
 (12, 'Printed Lawn 2P Suit', 'Stylish printed lawn kurta paired with matching trousers.', 4199.00),--48
 (13, '3P silk Embroidered Suit', 'Formal silk 3-piece with embellishments.', 11999.00),--49
  (14, 'Bridal Luxury Pret', 'Premium bridal-ready luxury pret ensemble.', 29999.00),--50
  (14, 'Elegant Luxury Pret Outfit', 'Refined luxury pret designed for formal evening events.', 19499.00),--51
  (15, 'Khaddar 3 Piece Unstitched Set', 'Winter khaddar fabric set ideal for custom tailoring.', 5799.00),--52
       (16, 'Organza Embroidered Fabric', 'Organza fabric with detailed embroidery.', 9999.00); --53
GO

INSERT INTO ProductVariant (ProductID, SizeID, ColorID, SKU, AdditionalStock)
VALUES
-- Product 1
(1, 1, 3, 'SKU-1-S-001', 25),
(1, 2, 3, 'SKU-1-M-001', 25),
(1, 3, 3, 'SKU-1-L-001', 25),

-- Product 2
(2, 1, 11, 'SKU-2-S-001', 25),
(2, 2, 11, 'SKU-2-M-001', 25),
(2, 3, 11, 'SKU-2-L-001', 25),
  

-- Product 3
(3, 1, 5, 'SKU-3-S-001', 25),
(3, 2, 5, 'SKU-3-M-001', 25),
(3, 3, 5, 'SKU-3-L-001', 25),

-- Product 4
(4, 1, 11, 'SKU-4-S-001', 25),
(4, 2, 11, 'SKU-4-M-001', 25),
(4, 3, 11, 'SKU-4-L-001', 25),

-- Product 5
(5, 1, 2, 'SKU-5-S-001', 25),
(5, 2, 2, 'SKU-5-M-001', 25),
(5, 3, 2, 'SKU-5-L-001', 25),

-- Product 6
(6, 1, 1, 'SKU-6-S-001', 25),
(6, 2, 1, 'SKU-6-M-001', 25),
(6, 3, 1, 'SKU-6-L-001', 25),

-- Product 7
(7, 1, 4, 'SKU-7-S-001', 25),
(7, 2, 4, 'SKU-7-M-001', 25),
(7, 3, 4, 'SKU-7-L-001', 25),

-- Product 8
(8, 1, 10, 'SKU-10-S-001', 25),
(8, 2, 10, 'SKU-10-M-001', 25),
(8, 3, 10, 'SKU-10-L-001', 25),

-- Product 9
(9, 1, 9, 'SKU-11-S-001', 25),
(9, 2, 9, 'SKU-11-M-001', 25),
(9, 3, 9, 'SKU-11-L-001', 25),

-- Product 12
(12, 1, 8, 'SKU-12-S-001', 25),
(12, 2, 8, 'SKU-12-M-001', 25),
(12, 3, 8, 'SKU-12-L-001', 25),

-- Product 13
(13, 1, 5, 'SKU-15-S-001', 25),
(13, 2, 5, 'SKU-15-M-001', 25),
(13, 3, 5, 'SKU-15-L-001', 25),

-- Product 14
(14, 1, 8, 'SKU-16-S-001', 25),
(14, 2, 8, 'SKU-16-M-001', 25),
(14, 3, 8, 'SKU-16-L-001', 25),

-- Product 17
(17, 1, 10, 'SKU-17-S-001', 25),
(17, 2, 10, 'SKU-17-M-001', 25),
(17, 3, 10, 'SKU-17-L-001', 25),

-- Product 20
(20, 1, 6, 'SKU-20-S-001', 25),
(20, 2, 6, 'SKU-20-M-001', 25),
(20, 3, 6, 'SKU-20-L-001', 25),

-- Product 21
(21, 1, 2, 'SKU-21-S-001', 25),
(21, 2, 2, 'SKU-21-M-001', 25),
(21, 3, 2, 'SKU-21-L-001', 25),

-- Product 22
(22, 1, 8, 'SKU-22-S-001', 25),
(22, 2, 8, 'SKU-22-M-001', 25),
(22, 3, 8, 'SKU-22-L-001', 25),

-- Product 25
(25, 1, 8, 'SKU-25-S-001', 25),
(25, 2, 8, 'SKU-25-M-001', 25),
(25, 3, 8, 'SKU-25-L-001', 25),

-- Product 26
(26, 1, 1, 'SKU-26-S-001', 25),
(26, 2, 1, 'SKU-26-M-001', 25),
(26, 3, 1, 'SKU-26-L-001', 25),

-- Product 27
(27, 1, 6, 'SKU-27-S-001', 25),
(27, 2, 6, 'SKU-27-M-001', 25),
(27, 3, 6, 'SKU-27-L-001', 25),

-- Product 28
(28, 1, 10, 'SKU-28-S-001', 25),
(28, 2, 10, 'SKU-28-M-001', 25),
(28, 3, 10, 'SKU-28-L-001', 25),


-- Product 29
(29, 1, 10, 'SKU-29-S-001', 25),
(29, 2, 10, 'SKU-29-M-001', 25),
(29, 3, 10, 'SKU-29-L-001', 25),

-- Product 32
(32, 1, 2, 'SKU-32-S-001', 25),
(32, 2, 2, 'SKU-32-M-001', 25),
(32, 3, 2, 'SKU-32-L-001', 25),


-- Product 33
(33, 1, 4, 'SKU-33-S-001', 25),
(33, 2, 4, 'SKU-33-M-001', 25),
(33, 3, 4, 'SKU-33-L-001', 25),

-- Product 34
(34, 1, 8, 'SKU-34-S-001', 25),
(34, 2, 8, 'SKU-34-M-001', 25),
(34, 3, 8, 'SKU-34-L-001', 25),

-- Product 37
(37, 1, 10, 'SKU-37-S-001', 25),
(37, 2, 10, 'SKU-37-M-001', 25),
(37, 3, 10, 'SKU-37-L-001', 25),

-- Product 38
(38, 1, 3, 'SKU-38-S-001', 25),
(38, 2, 3, 'SKU-38-M-001', 25),
(38, 3, 3, 'SKU-38-L-001', 25),

-- Product 39
(39, 1, 11, 'SKU-39-S-001', 25),
(39, 2, 11, 'SKU-39-M-001', 25),
(39, 3, 11, 'SKU-39-L-001', 25),

-- Product 42
(42, 1, 8, 'SKU-42-S-001', 25),
(42, 2, 8, 'SKU-42-M-001', 25),
(42, 3, 8, 'SKU-42-L-001', 25),


-- Product 43
(43, 1, 5, 'SKU-43-S-001', 25),
(43, 2, 5, 'SKU-43-M-001', 25),
(43, 3, 5, 'SKU-43-L-001', 25),

-- Product 44
(44, 1, 8, 'SKU-44-S-001', 25),
(44, 2, 8, 'SKU-44-M-001', 25),
(44, 3, 8, 'SKU-44-L-001', 25),

-- Product 47
(47, 1, 7, 'SKU-47-S-001', 25),
(47, 2, 7, 'SKU-47-M-001', 25),
(47, 3, 7, 'SKU-47-L-001', 25),

-- Product 48
(48, 1, 7, 'SKU-48-S-001', 25),
(48, 2, 7, 'SKU-48-M-001', 25),
(48, 3, 7, 'SKU-48-L-001', 25),

-- Product 49
(49, 1, 4, 'SKU-49-S-001', 25),
(49, 2, 4, 'SKU-49-M-001', 25),
(49, 3, 4, 'SKU-49-L-001', 25),

-- Product 50
(50, 1, 5, 'SKU-50-S-001', 25),
(50, 2, 5, 'SKU-50-M-001', 25),
(50, 3, 5, 'SKU-50-L-001', 25),

-- Product 51
(51, 1, 5, 'SKU-51-S-001', 25),
(51, 2, 5, 'SKU-51-M-001', 25),
(51, 3, 5, 'SKU-51-L-001', 25),


---------unstitched

(8, 4, 10, 'SKU-8-FS-001', 50),
(9, 4, 9, 'SKU-9-FS-001', 50),
(13, 4, 1, 'SKU-13-FS-001', 50),
(14, 4, 9, 'SKU-14-FS-001', 50),
(18, 4, 6, 'SKU-18-FS-001', 50),
(19, 4, 2, 'SKU-19-FS-001', 50),
(23, 4, 6, 'SKU-23-FS-001', 50),
(24, 4, 4, 'SKU-24-FS-001', 50),
(30, 4, 2, 'SKU-30-FS-001', 50),
(31, 4, 7, 'SKU-31-FS-001', 50),
(35, 4, 1, 'SKU-35-FS-001', 50),
(36, 4, 2, 'SKU-36-FS-001', 50),
(40, 4, 2, 'SKU-40-FS-001', 50),
(41, 4, 4, 'SKU-41-FS-001', 50),
(45, 4, 1, 'SKU-45-FS-001', 50),
(46, 4, 4, 'SKU-46-FS-001', 50);
GO

truncate table ProductImage


INSERT INTO ProductImage (ProductID, ImageURL, IsPrimary, DisplayOrder)
VALUES 
    (1,  'images/Men/Men stitched/1.jpeg', 1, 1),
    (2,  'images/Men/Men stitched/2.jpeg', 1, 1),
    (3,  'images/Men/Men stitched/3.jpeg', 1, 1),
    (4,  'images/Men/Men stitched/4.jpeg', 1, 1),
    (5,  'images/Men/Men stitched/5.jpeg', 1, 1),
    (6,  'images/Men/Men stitched/11.jpeg', 1, 1),
    (7,  'images/Men/Men stitched/7.jpeg', 1, 1),
    (8, 'images/Men/Men stitched/8.jpeg', 1, 1),
    (9, 'images/Women/Women stitch/luxury1.jpg', 1, 1),
    (10, 'images/Women/Women stitch/casual1.png', 1, 1),
    (11, 'images/Women/Women unstitch/casual2.jpg', 1, 1),
    (12, 'images/Women/Women unstitch/luxury2.jpg', 1, 1),
    (13, 'images/Men/Men stitched/casual1.jpeg', 1, 1),
    (14, 'images/Men/Men stitched/8.png', 1, 1),
    (15, 'images/Men/Men stitched/luxury2.png', 1, 1),
    (16, 'images/Men/Men stitched/20.png', 1, 1),
    (17, 'images/Men/Men stitched/22.png', 1, 1),
    (18, 'images/Women/Women stitch/4.png', 1, 1),
    (19, 'images/Women/Women stitch/5.png', 1, 1),
    (20, 'images/Women/Women stitch/luxury7.jpg', 1, 1),
    (21, 'images/Women/Women unstitch/casual1.jpg', 1, 1),
    (22, 'images/Women/Women unstitch/4.png', 1, 1),
     (23, 'images/Men/Men stitched/casual2.jpeg', 1, 1),
(24, 'images/Men/Men stitched/12.jpeg', 1, 1),
(25, 'images/Men/Men stitched/13.jpeg', 1, 1),
(26, 'images/Men/Men stitched/14.jpeg', 1, 1),
(27, 'images/Men/Men stitched/luxury1.jpeg', 1, 1),
(28, 'images/Men/Men stitched/21.png', 1, 1),
(29, 'images/Men/Men stitched/luxury3.png', 1, 1),
(30, 'images/Women/Women stitch/3.png', 1, 1),
(31, 'images/Women/Women stitch/formal6.jpg', 1, 1),
(32, 'images/Women/Women stitch/7.png', 1, 1),
(33, 'images/Women/Women unstitch/1.png', 1, 1),
(34, 'images/Women/Women unstitch/luxury6.jpg', 1, 1),
(35, 'images/Men/Men stitched/casual1.jpeg', 1, 1),
(36, 'images/Men/Men stitched/18.png', 1, 1),
(37, 'images/Men/Men stitched/19.png', 1, 1),
(38, 'images/Men/Men stitched/24.png', 1, 1),
(39, 'images/Men/Men stitched/23.png', 1, 1),
(40, 'images/Women/Women stitch/2.jpg', 1, 1),
(41, 'images/Women/Women stitch/luxury5.jpg', 1, 1),
(42, 'images/Women/Women stitch/luxury3.jpg', 1, 1),
(43, 'images/Women/Women unstitch/casual3.jpg', 1, 1),
(44, 'images/Women/Women unstitch/5.png', 1, 1),
 (45, 'images/Women/Women stitch/casual3.jpg', 1, 1),
  (46, 'images/Women/Women stitch/casual4.jpg', 1, 1),
   (47, 'images/Women/Women stitch/formal6.jpg', 1, 1),
     (48, 'images/Women/Women stitch/8.png', 1, 1),
       (49, 'images/Women/Women stitch/luxury4.jpg', 1, 1),
         (50, 'images/Women/Women unstitch/2.png', 1, 1),
         (51, 'images/Women/Women unstitch/3.png', 1, 1);
       
GO




 select * from product




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
GO

select * from Product


-- ==============================================================
-- UPDATE ORDER STATUS CONSTRAINT FOR REFUND/EXCHANGE
-- ==============================================================
IF OBJECT_ID('CHK_Order_Status', 'C') IS NOT NULL 
BEGIN
    ALTER TABLE Orders DROP CONSTRAINT CHK_Order_Status;
END
GO

ALTER TABLE Orders
ADD CONSTRAINT CHK_Order_Status CHECK (OrderStatus IN ('Pending','Processing','Shipped','Delivered','Cancelled', 'Refunded', 'Exchanged'));
GO

-- ==============================================================
-- PROCEDURE FOR REFUND/EXCHANGE
-- ==============================================================
CREATE OR ALTER PROCEDURE sp_ProcessOrderReturn
    @OrderID INT,
    @RequestType NVARCHAR(20) -- 'Refunded' or 'Exchanged'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @CurrentStatus NVARCHAR(20);
    
    SELECT @CurrentStatus = OrderStatus FROM Orders WHERE OrderID = @OrderID;
    
    IF @CurrentStatus IS NULL
    BEGIN
        THROW 51008, 'Order not found.', 1;
    END

    -- "Pending and Processing orders cannot be refunded or exchanged only delivered orders"
    IF @CurrentStatus IN ('Pending', 'Processing', 'Shipped') 
    BEGIN
        THROW 51009, 'Only delivered orders can be refunded or exchanged.', 1;
    END

    -- "Once an order is refunded or exchanged donot give option of refund and exchange again"
    IF @CurrentStatus IN ('Refunded', 'Exchanged')
    BEGIN
        THROW 51010, 'Order has already been processed for return.', 1;
    END
    
    IF @CurrentStatus = 'Delivered'
    BEGIN
        IF @RequestType NOT IN ('Refunded', 'Exchanged')
        BEGIN
             THROW 51011, 'Invalid return type. Must be Refunded or Exchanged.', 1;
        END

        UPDATE Orders 
        SET OrderStatus = @RequestType 
        WHERE OrderID = @OrderID;
        
        SELECT 'Order marked as ' + @RequestType AS Message;
    END
    ELSE
    BEGIN
        -- Should catch Cancelled or other weird states if any
         THROW 51012, 'Order status does not allow return.', 1;
    END
END;
GO

-- ==============================================================
-- ADD 5 UNIQUE USERS
-- ==============================================================
DECLARE @NewCust1 INT, @NewCust2 INT, @NewCust3 INT, @NewCust4 INT, @NewCust5 INT;

-- User 1
EXEC sp_RegisterCustomer 
    @CustomerName = 'John', @LastName = 'Doe', 
    @Email = 'john.doe@example.com', @PlainPassword = 'Pass123!', 
    @PhoneNo = '+1-555-0101', @DateOfBirth = '1990-01-01', 
    @CustomerID = @NewCust1 OUTPUT;

-- User 2
EXEC sp_RegisterCustomer 
    @CustomerName = 'Jane', @LastName = 'Smith', 
    @Email = 'jane.smith@example.com', @PlainPassword = 'Pass123!', 
    @PhoneNo = '+1-555-0102', @DateOfBirth = '1992-02-02', 
    @CustomerID = @NewCust2 OUTPUT;

-- User 3
EXEC sp_RegisterCustomer 
    @CustomerName = 'Alice', @LastName = 'Johnson', 
    @Email = 'alice.j@example.com', @PlainPassword = 'Pass123!', 
    @PhoneNo = '+1-555-0103', @DateOfBirth = '1988-03-03', 
    @CustomerID = @NewCust3 OUTPUT;

-- User 4
EXEC sp_RegisterCustomer 
    @CustomerName = 'Bob', @LastName = 'Brown', 
    @Email = 'bob.b@example.com', @PlainPassword = 'Pass123!', 
    @PhoneNo = '+1-555-0104', @DateOfBirth = '1985-04-04', 
    @CustomerID = @NewCust4 OUTPUT;

-- User 5
EXEC sp_RegisterCustomer 
    @CustomerName = 'Charlie', @LastName = 'Davis', 
    @Email = 'charlie.d@example.com', @PlainPassword = 'Pass123!', 
    @PhoneNo = '+1-555-0105', @DateOfBirth = '1995-05-05', 
    @CustomerID = @NewCust5 OUTPUT;

-- Login
-- 1. john.doe@example.com / Pass123!
-- 2. jane.smith@example.com / Pass123!
-- 3. alice.j@example.com / Pass123!
-- 4. bob.b@example.com / Pass123!
-- 5. charlie.d@example.com / Pass123!

-- ==============================================================
-- CREATE ADDRESSES FOR NEW USERS
-- ==============================================================
INSERT INTO Address (CustomerID, Street, City, PostalCode, Country, IsDefault) VALUES
(@NewCust1, '123 Main St', 'New York', '10001', 'USA', 1),
(@NewCust2, '456 Oak Ave', 'Los Angeles', '90001', 'USA', 1),
(@NewCust3, '789 Pine Ln', 'Chicago', '60601', 'USA', 1),
(@NewCust4, '321 Elm Dr', 'Houston', '77001', 'USA', 1),
(@NewCust5, '654 Maple Ct', 'Phoenix', '85001', 'USA', 1);

-- ==============================================================
-- CREATE 5 ORDERS (Statuses: Delivered, Processing, Pending, Refunded, Exchanged)
-- ==============================================================
DECLARE @Ord1 INT, @Ord2 INT, @Ord3 INT, @Ord4 INT, @Ord5 INT;
DECLARE @Addr1 INT, @Addr2 INT, @Addr3 INT, @Addr4 INT, @Addr5 INT;

-- Get Address IDs
SELECT @Addr1 = AddressID FROM Address WHERE CustomerID = @NewCust1;
SELECT @Addr2 = AddressID FROM Address WHERE CustomerID = @NewCust2;
SELECT @Addr3 = AddressID FROM Address WHERE CustomerID = @NewCust3;
SELECT @Addr4 = AddressID FROM Address WHERE CustomerID = @NewCust4;
SELECT @Addr5 = AddressID FROM Address WHERE CustomerID = @NewCust5;

-- 1. Order for John: Delivered
EXEC sp_AddOrUpdateCartItem @NewCust1, 1, 1;
EXEC sp_PlaceOrder @NewCust1, @Addr1, 'Standard', @Ord1 OUTPUT;
UPDATE Orders SET OrderStatus = 'Delivered' WHERE OrderID = @Ord1;

EXEC sp_AddOrUpdateCartItem @NewCust1, 1, 1;
EXEC sp_PlaceOrder @NewCust1, @Addr1, 'Standard', @Ord1 OUTPUT;
UPDATE Orders SET OrderStatus = 'Pending' WHERE OrderID = @Ord1;

EXEC sp_AddOrUpdateCartItem @NewCust1, 1, 1;
EXEC sp_PlaceOrder @NewCust1, @Addr1, 'Standard', @Ord1 OUTPUT;
UPDATE Orders SET OrderStatus = 'Processing' WHERE OrderID = @Ord1;

-- 2. Order for Jane: Processing
EXEC sp_AddOrUpdateCartItem @NewCust2, 2, 2;
EXEC sp_PlaceOrder @NewCust2, @Addr2, 'Standard', @Ord2 OUTPUT;
UPDATE Orders SET OrderStatus = 'Processing' WHERE OrderID = @Ord2;

EXEC sp_AddOrUpdateCartItem @NewCust2, 2, 2;
EXEC sp_PlaceOrder @NewCust2, @Addr2, 'Express', @Ord2 OUTPUT;
UPDATE Orders SET OrderStatus = 'Delivered' WHERE OrderID = @Ord2;

EXEC sp_AddOrUpdateCartItem @NewCust2, 2, 2;
EXEC sp_PlaceOrder @NewCust2, @Addr2, 'Standard', @Ord2 OUTPUT;
UPDATE Orders SET OrderStatus = 'Refunded' WHERE OrderID = @Ord2;

EXEC sp_AddOrUpdateCartItem @NewCust2, 2, 2;
EXEC sp_PlaceOrder @NewCust2, @Addr2, 'Standard', @Ord2 OUTPUT;
UPDATE Orders SET OrderStatus = 'Exchanged' WHERE OrderID = @Ord2;

-- 3. Order for Alice: Pending
EXEC sp_AddOrUpdateCartItem @NewCust3, 3, 1;
EXEC sp_PlaceOrder @NewCust3, @Addr3, 'Standard', @Ord3 OUTPUT;
UPDATE Orders SET OrderStatus = 'Pending' WHERE OrderID = @Ord3;

EXEC sp_AddOrUpdateCartItem @NewCust3, 3, 1;
EXEC sp_PlaceOrder @NewCust3, @Addr3, 'Standard', @Ord3 OUTPUT;
UPDATE Orders SET OrderStatus = 'Processing' WHERE OrderID = @Ord3;

EXEC sp_AddOrUpdateCartItem @NewCust3, 3, 1;
EXEC sp_PlaceOrder @NewCust3, @Addr3, 'Standard', @Ord3 OUTPUT;
UPDATE Orders SET OrderStatus = 'Delivered' WHERE OrderID = @Ord3;

EXEC sp_AddOrUpdateCartItem @NewCust3, 3, 1;
EXEC sp_PlaceOrder @NewCust3, @Addr3, 'Standard', @Ord3 OUTPUT;
UPDATE Orders SET OrderStatus = 'Refunded' WHERE OrderID = @Ord3;

EXEC sp_AddOrUpdateCartItem @NewCust3, 3, 1;
EXEC sp_PlaceOrder @NewCust3, @Addr3, 'Standard', @Ord3 OUTPUT;
UPDATE Orders SET OrderStatus = 'Exchanged' WHERE OrderID = @Ord3;  

-- 4. Order for Bob: Refunded (Was Delivered)
EXEC sp_AddOrUpdateCartItem @NewCust4, 4, 1;
EXEC sp_PlaceOrder @NewCust4, @Addr4, 'Express', @Ord4 OUTPUT;
UPDATE Orders SET OrderStatus = 'Delivered' WHERE OrderID = @Ord4; 
-- Mark as Refunded
EXEC sp_ProcessOrderReturn @Ord4, 'Refunded';

EXEC sp_AddOrUpdateCartItem @NewCust4, 4, 1;
EXEC sp_PlaceOrder @NewCust4, @Addr4, 'Standard', @Ord4 OUTPUT;
UPDATE Orders SET OrderStatus = 'Refunded' WHERE OrderID = @Ord4;

EXEC sp_AddOrUpdateCartItem @NewCust4, 4, 1;
EXEC sp_PlaceOrder @NewCust4, @Addr4, 'Standard', @Ord4 OUTPUT;
UPDATE Orders SET OrderStatus = 'Exchanged' WHERE OrderID = @Ord4;

-- 5. Order for Charlie: Exchanged (Was Delivered)
EXEC sp_AddOrUpdateCartItem @NewCust5, 5, 1;
EXEC sp_PlaceOrder @NewCust5, @Addr5, 'Standard', @Ord5 OUTPUT;
UPDATE Orders SET OrderStatus = 'Delivered' WHERE OrderID = @Ord5;
-- Mark as Exchanged
EXEC sp_ProcessOrderReturn @Ord5, 'Exchanged';

EXEC sp_AddOrUpdateCartItem @NewCust5, 5, 1;
EXEC sp_PlaceOrder @NewCust5, @Addr5, 'Standard', @Ord5 OUTPUT;
UPDATE Orders SET OrderStatus = 'Exchanged' WHERE OrderID = @Ord5;

GO
