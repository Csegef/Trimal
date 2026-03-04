const mysql = require('mysql2/promise');
const fs = require('fs');
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
        let output = "Tables:\n";
        for (let row of rows) {
            const tableName = Object.values(row)[0];
            output += `\n--- ${tableName} ---\n`;
            const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
            output += columns.map(c => `${c.Field} (${c.Type})`).join('\n') + '\n';
        }
        fs.writeFileSync('tables_dump.txt', output, 'utf8');
        console.log("Dumped to tables_dump.txt");
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

showTables();
