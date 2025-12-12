const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'aminah',
    password: process.env.DB_PASSWORD || 'aminah',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'StyleSphere',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000
    }
};

let pool = null;
let poolConnect = null;

async function getPool() {
    if (pool) return pool;

    if (!poolConnect) {
        poolConnect = (async () => {
            try {
                const newPool = new sql.ConnectionPool(config);
                const connectedPool = await newPool.connect();

                connectedPool.on('error', err => {
                    console.error('SQL Pool Error:', err);
                    // Reset pool on fatal errors so we can reconnect
                    pool = null;
                    poolConnect = null;
                });

                pool = connectedPool;
                console.log('Database connected successfully');
                return pool;
            } catch (err) {
                console.error('Database connection failed:', err);
                pool = null;
                poolConnect = null;
                throw err;
            }
        })();
    }

    return poolConnect;
}

module.exports = { sql, getPool };

