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
        const { categoryId } = req.query;
        const pool = await getPool();
        const request = pool.request();

        let query = `
            SELECT TOP 50
                p.ProductID,
                p.Name,
                p.Description,
                p.Price,
                p.TotalStock,
                c.CategoryName,
                (SELECT TOP 1 ImageURL FROM ProductImage WHERE ProductID = p.ProductID AND IsPrimary = 1) AS ImageURL
            FROM Product p
            INNER JOIN Category c ON c.CategoryID = p.CategoryID
            WHERE p.Status = 'Active'
        `;

        if (categoryId) {
            query += ' AND p.CategoryID = @CategoryID';
            request.input('CategoryID', sql.Int, categoryId);
        }

        if (req.query.search) {
            query += ' AND (p.Name LIKE @Search OR p.Description LIKE @Search)';
            request.input('Search', sql.NVarChar, `%${req.query.search}%`);
        }

        query += ' ORDER BY p.DateAdded DESC';

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
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
                p.TotalStock,
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
                pv.AdditionalStock
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

