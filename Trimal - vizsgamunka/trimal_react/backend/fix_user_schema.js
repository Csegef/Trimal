
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixUserSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Modifying user table to allow NULL for specie_id...');
        await connection.execute(`ALTER TABLE user MODIFY specie_id int(11) NULL`);
        console.log('User schema fix successful!');
    } catch (err) {
        console.error('User schema fix failed:', err);
    } finally {
        await connection.end();
    }
}

fixUserSchema();
