const express = require('express');
const { getPool, sql } = require('../db');

const router = express.Router();

router.get('/categories/tree', async (_req, res) => {
    try {
        const pool = await getPool();
        const result = await pool
            .request()
            .query('SELECT CategoryID, CategoryName, ParentCategoryID, Description FROM Category ORDER BY CategoryID');

        const nodes = result.recordset;
        const map = new Map();
        nodes.forEach((node) => {
            map.set(node.CategoryID, { ...node, children: [] });
        });

        const roots = [];
        nodes.forEach((node) => {
            if (node.ParentCategoryID) {
                const parent = map.get(node.ParentCategoryID);
                if (parent) {
                    parent.children.push(map.get(node.CategoryID));
                }
            } else {
                roots.push(map.get(node.CategoryID));
            }
        });

        res.json(roots);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/sizes', async (_req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT SizeID, SizeName FROM Size ORDER BY SizeID');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/products', async (req, res) => {
    try {
        console.log('[CATALOG V3] Products endpoint called');
        const { categoryId } = req.query;
        const pool = await getPool();
        const request = pool.request();

        let query;
        if (categoryId) {
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
            query = `
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
        }

        if (req.query.search) {
            // Remove ORDER BY, add search filter, then add ORDER BY back
            query = query.replace('ORDER BY p.ProductID', '');
            query += ' AND (p.Name LIKE @Search OR p.Description LIKE @Search) ORDER BY p.ProductID';
            request.input('Search', sql.NVarChar, `%${req.query.search}%`);
        }

        const result = await request.query(query);
        console.log('[CATALOG V3] Returning', result.recordset.length, 'products');
        res.json(result.recordset);
    } catch (error) {
        console.error('[CATALOG V3] Error:', error.message);
        res.status(500).json({ message: error.message });
    }
});

router.get('/products/:productId', async (req, res) => {
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('ProductID', sql.Int, req.params.productId);

        const product = await request.query(`
            SELECT 
                p.ProductID,
                p.Name,
                p.Description,
                p.Price,
                ISNULL((SELECT SUM(pv.AdditionalStock) FROM ProductVariant pv WHERE pv.ProductID = p.ProductID), 0) AS TotalStock,
                c.CategoryName
            FROM Product p
            INNER JOIN Category c ON c.CategoryID = p.CategoryID
            WHERE p.ProductID = @ProductID
        `);

        if (!product.recordset.length) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const variants = await request.query(`
            SELECT 
                pv.VariantID,
                pv.SizeID,
                s.SizeName,
                pv.ColorID,
                c.ColorName,
                c.HexCode,
                pv.SKU,
                pv.AdditionalStock AS StockQuantity
            FROM ProductVariant pv
            INNER JOIN Size s ON s.SizeID = pv.SizeID
            INNER JOIN Color c ON c.ColorID = pv.ColorID
            WHERE pv.ProductID = @ProductID
        `);

        const images = await request.query(`
            SELECT ImageURL, IsPrimary, DisplayOrder
            FROM ProductImage
            WHERE ProductID = @ProductID
            ORDER BY DisplayOrder
        `);

        res.json({
            ...product.recordset[0],
            variants: variants.recordset,
            images: images.recordset
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
