const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { getPool, sql } = require('./db');

const app = express();
const PORT = 4001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static images
app.use('/images', (req, res, next) => {
    req.url = decodeURIComponent(req.url);
    next();
}, express.static(path.resolve(__dirname, '../../images')));

app.get('/api/catalog/products', async (req, res) => {
    try {
        console.log('TEST SERVER - products endpoint hit');
        const pool = await getPool();
        const request = pool.request();

        const query = `
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
        `;

        const result = await request.query(query);
        console.log('Returning', result.recordset.length, 'products');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});
