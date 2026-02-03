
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLastUser() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await connection.execute(`SELECT id, email, verification_token, is_verified FROM user ORDER BY id DESC LIMIT 5`);
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkLastUser();
