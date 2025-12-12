const { getPool, sql } = require('./db');
async function check() {
    try {
        const pool = await getPool();
        const s = await pool.request().query("SELECT TOP 1 * FROM Size");
        console.log('Size Cols:', Object.keys(s.recordset[0] || {}));
        const c = await pool.request().query("SELECT TOP 1 * FROM Color");
        console.log('Color Cols:', Object.keys(c.recordset[0] || {}));
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
check();
