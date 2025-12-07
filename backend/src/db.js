const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'aminah',
    password: process.env.DB_PASSWORD || 'aminah',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'StyleSphere',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;

async function getPool() {
    if (pool) return pool;
    pool = await sql.connect(config);
    return pool;
}

module.exports = { sql, getPool };

