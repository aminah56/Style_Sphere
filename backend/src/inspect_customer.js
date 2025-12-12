const { getPool } = require('./db');

async function inspectCustomer() {
    try {
        const pool = await getPool();
        const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Customer'");
        console.log(res.recordset.map(c => c.COLUMN_NAME));
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}
inspectCustomer();
