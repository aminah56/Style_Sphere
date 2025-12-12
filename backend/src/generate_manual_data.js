const { getPool, sql } = require('./db');
const fs = require('fs');
const path = require('path');

// Unsplash Image URLs to cycle through (Mocking what might be in DB)
const IMAGES = [
    'https://images.unsplash.com/photo-1593030761757-71fae45fa0e6?auto=format&fit=crop&w=600&q=80', // Men/Shoes
    'https://images.unsplash.com/photo-1617137968427-85924c809a29?auto=format&fit=crop&w=600&q=80', // Men/Suit
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80', // Dress
    'https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&w=600&q=80', // Girl
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80', // Shirt
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80'  // T-shirt
];

// Product adjectives for generation
const ADJECTIVES = ['Classic', 'Modern', 'Elegant', 'Urban', 'Vintage', 'Premium', 'Casual', 'Formal', 'Cozy', 'Sleek'];
const NOUNS = ['Shirt', 'Trousers', 'Jacket', 'Dress', 'Scarf', 'Sweater', 'Blazer', 'Coat', 'Top', 'Tunis'];

async function generate() {
    try {
        const pool = await getPool();

        // 1. Get Categories
        const cats = await pool.request().query('SELECT CategoryID, CategoryName FROM Category');
        const categories = cats.recordset;

        let sqlOutput = `-- Auto-generated Manual Entries for 20 products per category\n\n`;

        // 2. Generate Products
        let startId = 1000; // Start IDs high to avoid collision, or let Identity handle it?
        // Usually IDENTITY_INSERT is OFF, so we skip ID. But user wants manual INSERTS "like there are already".
        // If the table has IDENTITY, we shouldn't insert ID. I'll inspect schema to check IsIdentity if I could, but usually we insert without ID.

        for (const cat of categories) {
            sqlOutput += `-- Category: ${cat.CategoryName} (${cat.CategoryID})\n`;

            for (let i = 0; i < 20; i++) {
                const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
                const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
                const name = `${adj} ${cat.CategoryName.split(' ')[0]} ${noun} ${i + 1}`;
                const price = Math.floor(Math.random() * (5000 - 1000) + 1000);
                const desc = `A ${adj.toLowerCase()} ${noun.toLowerCase()} perfect for any occasion. High quality styling.`;
                const img = IMAGES[i % IMAGES.length];

                // Declare variable for ProductID to link variants
                // Since this is a SQL script, we can't easily get the ID back without running it.
                // We will use DECLARE @PID table or variables.
                // Or better: INSERT ...; SET @ID = SCOPE_IDENTITY();

                sqlOutput += `
INSERT INTO Product (Name, Description, Price, CategoryID, Status, CreatedAt)
VALUES ('${name.replace(/'/g, "''")}', '${desc.replace(/'/g, "''")}', ${price}, ${cat.CategoryID}, 'Active', GETDATE());
DECLARE @P${cat.CategoryID}_${i} INT = SCOPE_IDENTITY();

-- Image
INSERT INTO ProductImage (ProductID, ImageURL, IsPrimary, DisplayOrder)
VALUES (@P${cat.CategoryID}_${i}, '${img}', 1, 1);

-- Variants (S, M, L)
`;
                // Add S, M, L
                ['S', 'M', 'L'].forEach(size => {
                    // Random stock, some 0 to test out-of-stock
                    // 10% chance of 0 stock
                    const stock = Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 50) + 1;

                    sqlOutput += `INSERT INTO ProductVariant (ProductID, Size, Color, StockQuantity, AdditionalStock, PriceAdjustment)
VALUES (@P${cat.CategoryID}_${i}, '${size}', 'Default', ${stock}, ${stock}, 0.00);
`;
                });

                sqlOutput += '\n';
            }
        }

        fs.writeFileSync(path.resolve(__dirname, '../../stylesphere_manual_updates.sql'), sqlOutput);
        console.log('SQL generated successfully: stylesphere_manual_updates.sql');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

generate();
