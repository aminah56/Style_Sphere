const fs = require('fs');
const path = require('path');
const sql = require('mssql');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
    user: process.env.DB_USER || 'aminah',
    password: process.env.DB_PASSWORD || 'aminah',
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function applySchema() {
    console.log('Reading SQL file...');
    const sqlPath = path.resolve(__dirname, '../../stylesphere_db.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('SQL file not found at:', sqlPath);
        process.exit(1);
    }
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split by GO
    const batches = sqlContent
        .split(/\nGO\s*\n/i) // Split by GO on a new line
        .map(b => b.trim())
        .filter(b => b.length > 0);

    let pool = null;
    try {
        // Connect to master first to create DB if needed
        console.log('Connecting to SQL Server (master)...');
        pool = await sql.connect({
            ...dbConfig,
            database: 'master'
        });

        // Run batches
        for (let i = 0; i < batches.length; i++) {
            let batch = batches[i];

            // Remove 'USE StyleSphere' as we handle connection context, or let it run if it switches context
            // But node-mssql might not like changing DB mid-connection if not supported.
            // Actually, best to run the DB creation part, then reconnect to StyleSphere.

            if (batch.includes('CREATE DATABASE StyleSphere')) {
                try {
                    await pool.request().query(batch);
                } catch (err) {
                    // Check if DB exists error or similar, though IF NOT EXISTS should handle it
                    console.log('Database creation step:', err.message);
                }
            } else {
                // Determine if we need to switch connection
                if (batch.includes('USE StyleSphere')) {
                    console.log('Switching to StyleSphere database...');
                    await pool.close();
                    pool = await sql.connect({
                        ...dbConfig,
                        database: 'StyleSphere'
                    });
                    continue; // Skip the USE command itself if we reconnected
                }

                console.log(`Executing batch ${i + 1}/${batches.length}...`);
                try {
                    await pool.request().query(batch);
                } catch (err) {
                    // Ignore some specific errors if they are harmless (like drop table if not exists)
                    // But our script handles most via IF EXISTS
                    console.error(`Error in batch ${i + 1}:`, err.message);
                    // We continue? Yes, for resilience.
                }
            }
        }

        console.log('Schema applied successfully.');

    } catch (err) {
        console.error('Global error:', err);
    } finally {
        if (pool) await pool.close();
    }
}

applySchema();
