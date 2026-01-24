require('dotenv').config({ path: '../.env' });
const { getPool } = require('./db');
const sql = require('mssql');

async function testConnection() {
    console.log('Testing connection to Azure SQL with settings:');
    console.log(`Server: ${process.env.DB_SERVER}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);

    try {
        console.log('Attempting to connect...');
        const pool = await getPool();
        console.log('Successfully connected!');

        console.log('Running test query...');
        const result = await pool.request().query('SELECT TOP 1 * FROM Customer');
        console.log('Query successful. Result:', result.recordset);

        process.exit(0);
    } catch (err) {
        console.error('CONNECTION ERROR FAILED:', err);
        process.exit(1);
    }
}

testConnection();
