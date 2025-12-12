const { getPool, sql } = require('./db');
const fs = require('fs');
const path = require('path');

async function inspect() {
    try {
        const pool = await getPool();

        console.log('--- Categories ---');
        const cats = await pool.request().query('SELECT * FROM Category');
        console.log(JSON.stringify(cats.recordset, null, 2));

        console.log('\n--- Existing Products (First 5) ---');
        const prods = await pool.request().query('SELECT TOP 5 * FROM Product');
        console.log(JSON.stringify(prods.recordset, null, 2));

        console.log('\n--- Schema: Product ---');
        const schema = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Product'
        `);
        console.log(JSON.stringify(schema.recordset, null, 2));

        console.log('\n--- Schema: ProductVariant ---');
        const schemaVar = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'ProductVariant'
        `);
        console.log(JSON.stringify(schemaVar.recordset, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

inspect();
