
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumns() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log("--- USER TABLE ---");
        const [userRows] = await connection.execute(`DESCRIBE user`);
        console.log(userRows.map(r => `${r.Field} (${r.Type})`).join('\n'));

        console.log("\n--- SPECIE TABLE ---");
        const [specieRows] = await connection.execute(`DESCRIBE specie`);
        console.log(specieRows.map(r => `${r.Field} (${r.Type})`).join('\n'));

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkColumns();
