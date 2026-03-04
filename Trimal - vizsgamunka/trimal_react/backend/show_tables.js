const mysql = require('mysql2/promise');
require('dotenv').config();

async function showTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await connection.execute(`SHOW TABLES`);
        console.log("Tables:");
        for (let row of rows) {
            const tableName = Object.values(row)[0];
            console.log(`\n--- ${tableName} ---`);
            const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
            console.log(columns.map(c => `${c.Field} (${c.Type})`).join('\n'));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

showTables();
