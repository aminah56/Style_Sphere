const { getPool, sql } = require('./db');
const fs = require('fs');
const path = require('path');

const IMAGES = [
    'https://images.unsplash.com/photo-1593030761757-71fae45fa0e6?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1617137968427-85924c809a29?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80'
];

const ADJECTIVES = ['Classic', 'Modern', 'Elegant', 'Urban', 'Vintage', 'Premium', 'Casual', 'Formal'];
const NOUNS = ['Shirt', 'Trousers', 'Jacket', 'Dress', 'Scarf', 'Sweater', 'Blazer'];

async function run() {
    try {
        const pool = await getPool();

        // Fetch Categories
        const cats = await pool.request().query('SELECT CategoryID, CategoryName FROM Category');
        const categories = cats.recordset;

        // Fetch Sizes
        const sizes = await pool.request().query('SELECT SizeID, SizeName FROM Size');
        const sizeMap = {};
        sizes.recordset.forEach(s => sizeMap[s.SizeName] = s.SizeID);
        // Fallback or ensure S, M, L exist. If not, pick available.
        const sizeKeys = ['S', 'M', 'L'];

        // Fetch Colors
        const colors = await pool.request().query('SELECT ColorID, ColorName FROM Color');
        if (colors.recordset.length === 0) throw new Error("No colors found in DB. Cannot create variants.");
        const defaultColorId = colors.recordset[0].ColorID;

        let sqlFileContent = `\n-- Manual Data Entry (${new Date().toISOString()})\n`;
        const filePath = path.resolve(__dirname, '../../StyleSphere.sql');

        for (const cat of categories) {
            console.log(`Processing Category: ${cat.CategoryName}`);

            for (let i = 0; i < 20; i++) {
                const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
                const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
                const name = `${adj} ${cat.CategoryName.split(' ')[0]} ${noun} ${i + 1}`;
                const price = Math.floor(Math.random() * (5000 - 1000) + 1000);
                const desc = `A ${adj.toLowerCase()} ${noun.toLowerCase()} perfect for any occasion.`;
                const img = IMAGES[i % IMAGES.length];

                // 1. Insert into DB (Single item)
                const res = await pool.request()
                    .input('Name', sql.NVarChar, name)
                    .input('Desc', sql.NVarChar, desc)
                    .input('Price', sql.Decimal(10, 2), price)
                    .input('CatID', sql.Int, cat.CategoryID)
                    .query(`
                        INSERT INTO Product (Name, Description, Price, CategoryID, Status, DateAdded, TotalStock)
                        VALUES (@Name, @Desc, @Price, @CatID, 'Active', GETDATE(), 30);
                        SELECT SCOPE_IDENTITY() AS ProductID;
                    `);

                const pid = res.recordset[0].ProductID;

                // 2. Insert Image
                await pool.request()
                    .input('PID', sql.Int, pid)
                    .input('URL', sql.NVarChar, img)
                    .query("INSERT INTO ProductImage (ProductID, ImageURL, IsPrimary, DisplayOrder) VALUES (@PID, @URL, 1, 1)");

                // 3. Insert Variants
                for (const sizeName of sizeKeys) {
                    const sizeId = sizeMap[sizeName] || sizeMap[Object.keys(sizeMap)[0]]; // Fallback
                    if (!sizeId) continue;

                    const stock = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 50) + 1;
                    const sku = `SKU-${pid}-${sizeName}-${Date.now()}`; // Simple SKU

                    await pool.request()
                        .input('PID', sql.Int, pid)
                        .input('SizeID', sql.Int, sizeId)
                        .input('ColorID', sql.Int, defaultColorId)
                        .input('Stock', sql.Int, stock)
                        .input('SKU', sql.NVarChar, sku)
                        .query(`
                            INSERT INTO ProductVariant (ProductID, SizeID, ColorID, AdditionalStock, SKU)
                            VALUES (@PID, @SizeID, @ColorID, @Stock, @SKU)
                        `);

                    // Add text to SQL. Note: We assume IDs are known in the SQL script context?
                    // No, IDs depend on target DB. 
                    // To make the script portable (user request "manual code in insert statement"), 
                    // we should select IDs by name or use numeric literals if we assume schema match.
                    // I will use subqueries in the SQL text: (SELECT SizeID FROM Size WHERE SizeName = 'S')

                    sqlFileContent += `
INSERT INTO ProductVariant (ProductID, SizeID, ColorID, AdditionalStock, SKU) 
VALUES (@P${cat.CategoryID}_${i}_${Date.now()}, (SELECT TOP 1 SizeID FROM Size WHERE SizeName = '${sizeName}'), (SELECT TOP 1 ColorID FROM Color), 10, 'SKU-GEN-${i}-${sizeName}');
`; // Using simplified stock/sku for text
                }

                // File content for Product/Image
                sqlFileContent += `
INSERT INTO Product (Name, Description, Price, CategoryID, Status, DateAdded, TotalStock)
VALUES ('${name.replace(/'/g, "''")}', '${desc.replace(/'/g, "''")}', ${price}, ${cat.CategoryID}, 'Active', GETDATE(), 30);
DECLARE @P${cat.CategoryID}_${i}_${Date.now()} INT = SCOPE_IDENTITY();

INSERT INTO ProductImage (ProductID, ImageURL, IsPrimary, DisplayOrder)
VALUES (@P${cat.CategoryID}_${i}_${Date.now()}, '${img}', 1, 1);
`;
            }
        }

        fs.writeFileSync(filePath, sqlFileContent, { flag: 'a' }); // Append
        console.log('Appended to StyleSphere.sql and updated DB.');
        process.exit(0);
    } catch (err) {
        console.error('Error Message:', err.message);
        process.exit(1);
    }
}

run();
