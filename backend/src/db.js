const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'aminah',
    password: process.env.DB_PASSWORD || 'Tariq@123',
    server: process.env.DB_SERVER || 'aminah.database.windows.net',
    database: process.env.DB_NAME || 'StyleSphere',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: true, // Required for Azure SQL DB
        trustServerCertificate: false, // Must be false for Azure SQL DB to use proper SSL
        enableArithAbort: true,
        requestTimeout: 30000, // 30 seconds timeout for requests
        connectionTimeout: 30000 // 30 seconds timeout for initial connection
    },
    pool: {
        max: 10,
        min: 2,
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 30000 // Timeout for acquiring connection from pool
    }
};

let pool = null;
let poolConnect = null;

async function getPool() {
    if (pool && pool.connected) return pool;

    if (!poolConnect) {
        poolConnect = (async () => {
            const maxRetries = 3;
            let retryCount = 0;

            while (retryCount < maxRetries) {
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
                    console.log('Database connected successfully to Azure SQL DB');
                    return pool;
                } catch (err) {
                    retryCount++;
                    console.error(`Database connection failed (attempt ${retryCount}/${maxRetries}):`, err.message);
                    
                    if (retryCount >= maxRetries) {
                        console.error('Failed to connect to database after', maxRetries, 'attempts');
                        pool = null;
                        poolConnect = null;
                        throw err;
                    }
                    
                    // Wait before retrying (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                }
            }
        })();
    }

    return poolConnect;
}

module.exports = { sql, getPool };