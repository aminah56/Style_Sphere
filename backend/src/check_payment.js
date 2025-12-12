const { getPool, sql } = require('./db');
async function check() {
    try {
        const pool = await getPool();
        const res = await pool.request().query("SELECT TOP 1 * FROM Payment");
        console.log('Payment Cols:', Object.keys(res.recordset[0] || {}));
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
check();
