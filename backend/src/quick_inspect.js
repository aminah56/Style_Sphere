const { getPool, sql } = require('./db');
async function run() {
    try {
        const pool = await getPool();
        const res = await pool.request().query("SELECT TOP 1 * FROM Product");
        console.log('Columns:', Object.keys(res.recordset[0] || {}));
        // If empty, use sys.columns
        if (!res.recordset.length) {
            const cols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Product'");
            console.log('Schema Cols:', cols.recordset.map(c => c.COLUMN_NAME));
        }
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
run();
