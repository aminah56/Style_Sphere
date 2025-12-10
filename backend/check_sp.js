const { getPool } = require('./src/db');
async function check() {
    try {
        const pool = await getPool();
        const res = await pool.request().query("sp_helptext 'sp_AddOrUpdateCartItem'");
        console.log(res.recordset.map(r => r.Text).join(''));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
