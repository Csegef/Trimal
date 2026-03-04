const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate_shop() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS shop (
                id INT(11) AUTO_INCREMENT PRIMARY KEY,
                specie_id INT(11) NOT NULL,
                shop_type ENUM('tinkerer', 'herbalist') NOT NULL,
                item_type ENUM('weapon', 'armor', 'food', 'misc') NOT NULL,
                item_id INT(11) NOT NULL,
                created_date DATE NOT NULL,
                purchased TINYINT(1) DEFAULT 0,
                INDEX (specie_id),
                INDEX (created_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created 'shop' table successfully.");
        // We will optionally add purchased state, so 1 time buy for equipments.
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

migrate_shop();
