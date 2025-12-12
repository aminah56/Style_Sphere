const { getPool, sql } = require('./db');
const fs = require('fs');
const path = require('path');

async function runSql() {
    try {
        const pool = await getPool();
        const sqlPath = path.resolve(__dirname, '../../stylesphere_manual_updates.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing manual updates SQL...');

        // Wrap in transaction for safety
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            await request.query(sqlContent);

            await transaction.commit();
            console.log('Successfully inserted manual data.');
        } catch (err) {
            await transaction.rollback();
            console.error('Transaction failed:', err);
            // If errors are due to variable scope batching issues, we might need to split it
            // But valid T-SQL script with DECLARE at top or block should work in one go if short.
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

runSql();
