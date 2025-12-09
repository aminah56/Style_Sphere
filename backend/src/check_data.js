const { getPool, sql } = require('./db');

async function testQuery() {
    try {
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT TOP 50
                p.ProductID,
                p.Name,
                p.Description,
                p.Price,
                ISNULL((SELECT SUM(pv.AdditionalStock) FROM ProductVariant pv WHERE pv.ProductID = p.ProductID), 0) AS TotalStock,
                c.CategoryName,
                (SELECT TOP 1 ImageURL FROM ProductImage WHERE ProductID = p.ProductID ORDER BY IsPrimary DESC, DisplayOrder) AS ImageURL
            FROM Product p
            INNER JOIN Category c ON c.CategoryID = p.CategoryID
            WHERE p.Status = 'Active'
            AND EXISTS (SELECT 1 FROM ProductImage pi WHERE pi.ProductID = p.ProductID)
            ORDER BY p.ProductID
        `);

        console.log('Results count:', result.recordset.length);
        result.recordset.forEach(p => {
            console.log(`ID: ${p.ProductID}, Name: ${p.Name.substring(0, 20)}, Stock: ${p.TotalStock}, Image: ${p.ImageURL ? 'YES' : 'NO'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testQuery();
