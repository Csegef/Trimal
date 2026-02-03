
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
        const [rows] = await connection.execute(`DESCRIBE user`);
        console.log(rows.map(r => r.Field));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkColumns();
