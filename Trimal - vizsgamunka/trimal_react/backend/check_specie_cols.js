const mysql = require('mysql2/promise');

async function check() {
    const pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'trimal'
    });

    try {
        const [columns] = await pool.query("SHOW COLUMNS FROM specie");
        console.log(columns.map(c => c.Field));
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

check();
