
const mysql = require('mysql2/promise');
require('dotenv').config();

const DEFAULT_INVENTORY = {
    capacity: 100,
    used: 0,
    currency: {
        normal: 0,
        spec: 0
    },
    items: [],
    equipped: {
        weapon: null,
        armor_head: null,
        armor_chest: null,
        armor_legs: null,
        armor_feet: null
    }
};

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // 1. Get Quest IDs for each difficulty
        const [easyQuests] = await connection.execute('SELECT quest_id FROM quest WHERE difficulty = "easy"');
        const [mediumQuests] = await connection.execute('SELECT quest_id FROM quest WHERE difficulty = "medium"');
        const [hardQuests] = await connection.execute('SELECT quest_id FROM quest WHERE difficulty = "hard"');

        if (easyQuests.length === 0 || mediumQuests.length === 0 || hardQuests.length === 0) {
            console.error("Not enough quests in DB to assign!");
            return;
        }

        // 2. Get Species that need update (verified users' species)
        // We assume verified users have is_verified = 1 in user table
        const [speciesToUpdate] = await connection.execute(`
            SELECT s.id, s.inventory_json, s.quest_1, s.quest_2, s.quest_3 
            FROM specie s
            JOIN user u ON s.user_id = u.id
            WHERE u.is_verified = 1 AND (s.inventory_json IS NULL OR s.quest_1 IS NULL OR s.quest_1 = 0)
        `);

        console.log(`Found ${speciesToUpdate.length} species to update.`);

        for (const specie of speciesToUpdate) {
            const updates = [];
            const params = [];

            // Update Inventory if missing
            if (!specie.inventory_json) {
                updates.push('inventory_json = ?');
                params.push(JSON.stringify(DEFAULT_INVENTORY));
            }

            // Update Quests if missing (checking quest_1 as indicator)
            if (!specie.quest_1 || specie.quest_1 === 0) {
                const q1 = easyQuests[Math.floor(Math.random() * easyQuests.length)].quest_id;
                const q2 = mediumQuests[Math.floor(Math.random() * mediumQuests.length)].quest_id;
                const q3 = hardQuests[Math.floor(Math.random() * hardQuests.length)].quest_id;

                updates.push('quest_1 = ?, quest_2 = ?, quest_3 = ?');
                params.push(q1, q2, q3);
            }

            if (updates.length > 0) {
                params.push(specie.id);
                await connection.execute(`UPDATE specie SET ${updates.join(', ')} WHERE id = ?`, params);
                console.log(`Updated Specie ID: ${specie.id}`);
            }
        }

        console.log("Migration completed.");

    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

migrate();
