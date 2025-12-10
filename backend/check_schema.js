const { getPool } = require('./src/db');
async function check() {
    try {
        const pool = await getPool();
        const res = await pool.request().query("SELECT TOP 0 * FROM Product");
        console.log('Columns:', Object.keys(res.recordset.columns).join(', '));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
