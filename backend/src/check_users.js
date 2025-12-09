
const { sql, getPool } = require('./db');

async function checkUsers() {
    try {
        const pool = await getPool();
        const res = await pool.request().query('SELECT * FROM Customer');
        console.log('Customers:', res.recordset);
    } catch (e) {
        console.error(e.message);
    }
}

checkUsers();
