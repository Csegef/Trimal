
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Modifying specie table to allow NULL for shop_id and quest_id...');
        // Drop foreign keys first if necessary, but usually modifying column is enough if we just allow NULL
        // However, if strict mode is on, we might need to be careful.

        // Check constraints names? 'specie_ibfk_2' and 'specie_ibfk_3' based on sql file.

        await connection.execute(`ALTER TABLE specie MODIFY shop_id int(11) NULL`);
        await connection.execute(`ALTER TABLE specie MODIFY quest_id int(11) NULL`);

        console.log('Schema fix successful!');
    } catch (err) {
        console.error('Schema fix failed:', err);
    } finally {
        await connection.end();
    }
}

fixSchema();
