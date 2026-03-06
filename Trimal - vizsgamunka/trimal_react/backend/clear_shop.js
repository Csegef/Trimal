const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'trimal'
    });
    
    console.log("Connected to DB.");
    const [result] = await connection.execute("DELETE FROM shop WHERE created_date = CURDATE()");
    console.log("Deleted rows:", result.affectedRows);
    
    await connection.end();
}

run().catch(console.error);
