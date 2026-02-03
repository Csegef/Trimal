
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Adding verification columns to user table...');
        await connection.execute(`
      ALTER TABLE user 
      ADD COLUMN verification_token varchar(255) DEFAULT NULL,
      ADD COLUMN is_verified tinyint(1) NOT NULL DEFAULT 0;
    `);
        console.log('Migration successful!');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist, skipping.');
        } else {
            console.error('Migration failed:', err);
        }
    } finally {
        await connection.end();
    }
}

migrate();
