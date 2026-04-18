require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'test_test_trimal', // Assuming name from other files, but I'll use standard TRIMAL env connection
    });

    try {
        const specieId = 5;
        const [rows] = await pool.execute('SELECT inventory_json FROM specie WHERE id = ?', [specieId]);
        if (rows.length === 0) {
            console.log('Specie ID 5 not found.');
            process.exit(0);
        }

        let inv = {
            capacity: 200,
            used: 0,
            currency: { normal: 0, spec: 0 },
            items: [],
            equipped: { weapon: null, armor_cap: null, armor_plate: null, armor_leggings: null, armor_boots: null },
            stamina: { current: 100, max: 100, last_reset: Math.floor(Date.now() / 1000) },
            active_quest: null,
            active_buffs: []
        };

        if (rows[0].inventory_json) {
            try {
                inv = { ...inv, ...JSON.parse(rows[0].inventory_json) };
            } catch (e) {
                console.log('Failed to parse inventory');
            }
        }

        // Add dungeon_script
        inv.items = inv.items || [];
        const existing = inv.items.find(i => i.type === 'misc' && (i.name || '').toLowerCase().includes('dungeon'));
        if (existing) {
            existing.quantity += 1;
        } else {
            inv.items.push({
                id: 9999, // dummy id
                type: 'misc',
                name: 'Dungeon Script',
                rarity: 'legendary',
                quantity: 1,
                description: 'An ancient script detailing hidden dungeons.',
                sell_price: 1500,
                iconPath: 'dungeon_script.png',
                inventory_size: 10,
                category: ''
            });
            inv.used += 10;
        }

        await pool.execute('UPDATE specie SET inventory_json = ? WHERE id = ?', [JSON.stringify(inv), specieId]);
        console.log('Dungeon Script added successfully to Specie ID 5!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
