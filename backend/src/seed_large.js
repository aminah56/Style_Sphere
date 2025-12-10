const { sql, getPool } = require('./db');

const menImages = [
    'Men/Men stitched/casual1.png',
    'Men/Men stitched/casual2.png',
    'Men/Men stitched/luxury1.png',
    'Men/Men stitched/luxury2.png',
    'Men/Men stitched/luxury3.png'
];

const womenImages = [
    'Women/Women stitch/casual1.jpg',
    'Women/Women stitch/casual2.jpg',
    'Women/Women stitch/casual3.jpg',
    'Women/Women stitch/casual4.jpg',
    'Women/Women stitch/formal1.jpg',
    'Women/Women stitch/formal2.jpg',
    'Women/Women stitch/formal3.jpg',
    'Women/Women stitch/formal4.jpg',
    'Women/Women stitch/formal5.jpg',
    'Women/Women stitch/luxury1.jpg'
];

async function seed() {
    try {
        const pool = await getPool();
        console.log('Connected to DB');

        // 1. Get leaf categories
        const categoriesResult = await pool.request().query(`
            SELECT c.CategoryID, c.CategoryName 
            FROM Category c
            WHERE NOT EXISTS (
                SELECT 1 FROM Category child WHERE child.ParentCategoryID = c.CategoryID
            )
        `);
        const categories = categoriesResult.recordset;
        console.log(`Found ${categories.length} leaf categories`);

        // Get Sizes and Colors
        const sizesResult = await pool.request().query('SELECT SizeID, SizeName FROM Size');
        const colorsResult = await pool.request().query('SELECT ColorID, ColorName FROM Color');
        const sizes = sizesResult.recordset;
        const colors = colorsResult.recordset;

        for (const cat of categories) {
            console.log(`Seeding category: ${cat.CategoryName}`);
            const isMen = cat.CategoryName.toLowerCase().includes('men');
            const imagePool = isMen ? menImages : womenImages;

            for (let i = 0; i < 20; i++) {
                const imgPath = imagePool[Math.floor(Math.random() * imagePool.length)];
                const price = 2000 + Math.floor(Math.random() * 10000);

                // Insert Product
                const productRes = await pool.request()
                    .input('CategoryID', sql.Int, cat.CategoryID)
                    .input('Name', sql.NVarChar, `${cat.CategoryName} - Item ${i + 1}`)
                    .input('Description', sql.NVarChar, `Premium quality ${cat.CategoryName.toLowerCase()} item. Perfect for any occasion.`)
                    .input('Price', sql.Decimal(10, 2), price)
                    .input('Status', sql.NVarChar, 'Active')
                    .query(`
                        INSERT INTO Product (CategoryID, Name, Description, Price, Status, DateAdded)
                        OUTPUT INSERTED.ProductID
                        VALUES (@CategoryID, @Name, @Description, @Price, @Status, GETDATE())
                    `);

                const productId = productRes.recordset[0].ProductID;

                // Insert Image
                await pool.request()
                    .input('ProductID', sql.Int, productId)
                    .input('ImageURL', sql.NVarChar, imgPath)
                    .query(`
                        INSERT INTO ProductImage (ProductID, ImageURL, IsPrimary, DisplayOrder)
                        VALUES (@ProductID, @ImageURL, 1, 1)
                    `);

                // Insert Variants
                for (const color of colors.slice(0, 2)) { // Pick first 2 colors
                    for (const size of sizes) {
                        const stock = 50 + Math.floor(Math.random() * 50); // Stock 50-100
                        await pool.request()
                            .input('ProductID', sql.Int, productId)
                            .input('SizeID', sql.Int, size.SizeID)
                            .input('ColorID', sql.Int, color.ColorID)
                            .input('Stock', sql.Int, stock)
                            .query(`
                                INSERT INTO ProductVariant (ProductID, SizeID, ColorID, AdditionalStock, SKU)
                                VALUES (@ProductID, @SizeID, @ColorID, @Stock, NEWID())
                            `);
                    }
                }
            }
        }
        console.log('Seeding completed!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
