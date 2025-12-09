
const { sql, getPool } = require('./db');

async function checkCarts() {
    try {
        const pool = await getPool();
        const res = await pool.request().query('SELECT * FROM Cart WHERE CustomerID = 1');
        console.log('Carts for Customer 1:', res.recordset);
    } catch (e) {
        console.error(e.message);
    }
}

checkCarts();
