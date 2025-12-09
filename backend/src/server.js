const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { getPool } = require('./db');
const authRoutes = require('./routes/auth');
const catalogRoutes = require('./routes/catalog');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const ordersRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static images from the images directory at project root
// Add middleware to handle URL-encoded paths (spaces as %20)
app.use('/images', (req, res, next) => {
    req.url = decodeURIComponent(req.url);
    next();
}, express.static(path.resolve(__dirname, '../../images')));

app.get('/api/health', async (_req, res) => {
    try {
        await getPool();
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const userRoutes = require('./routes/user'); // Add this import

// ...

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); // Add this usage

// --- INLINE PRODUCTS ENDPOINT TO FIX CACHING ISSUE ---
const { sql } = require('./db');
app.get('/api/catalog/products', async (req, res) => {
    try {
        console.log('[INLINE] Products endpoint hit');
        const { categoryId, search } = req.query;
        const pool = await getPool();
        const request = pool.request();

        let query = `
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
        `;

        if (categoryId) {
            // Need CTE for category filtering
            query = `
                WITH CategoryTree AS (
                    SELECT CategoryID FROM Category WHERE CategoryID = @CategoryID
                    UNION ALL
                    SELECT c.CategoryID FROM Category c
                    INNER JOIN CategoryTree ct ON c.ParentCategoryID = ct.CategoryID
                )
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
                AND p.CategoryID IN (SELECT CategoryID FROM CategoryTree)
                AND EXISTS (SELECT 1 FROM ProductImage pi WHERE pi.ProductID = p.ProductID)
                ORDER BY p.ProductID
            `;
            request.input('CategoryID', sql.Int, categoryId);
        } else {
            query += ' ORDER BY p.ProductID';
        }

        if (search) {
            query = query.replace('ORDER BY p.ProductID', 'AND (p.Name LIKE @Search OR p.Description LIKE @Search) ORDER BY p.ProductID');
            request.input('Search', sql.NVarChar, `%${search}%`);
        }

        const result = await request.query(query);
        console.log('[INLINE] Returning', result.recordset.length, 'products');
        res.json(result.recordset);
    } catch (error) {
        console.error('[INLINE] Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});
// --- END INLINE PRODUCTS ENDPOINT ---

app.use('/api/catalog', catalogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', ordersRoutes);

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});

