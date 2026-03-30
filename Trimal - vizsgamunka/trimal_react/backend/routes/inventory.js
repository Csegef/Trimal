// backend/routes/inventory.js
// Direct MySQL implementation – no PHP proxy needed.
// Inventory is stored as JSON in specie.inventory_json

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Handle level-up logic: increase stats and XP threshold */
async function handleLevelUp(pool, specieId, currentLvl, currentXp, xpToAdd) {
  let lvl = currentLvl;
  let xp = currentXp + xpToAdd;
  
  let levelsGained = 0;
  while (xp >= lvl * 100) {
    xp -= (lvl * 100);
    lvl++;
    levelsGained++;
  }

  if (levelsGained > 0) {
    // Stat increase: +1 to all, every 5 levels the increase increases by 1
    // 1-5: +1, 6-10: +2, 11-15: +3, etc.
    const statIncrease = 1 + Math.floor((lvl - 1 - levelsGained) / 5); 
    // Wait, the requirement says "1-5ig +1, majd 6-10-ig +2". 
    // This means at level 6 transition (from 5 to 6), the increase should be +2? 
    // Or does it mean while being level 6-10?
    // Let's use: for each level gained, calculate its specific increase.
    
    let totalStatInc = 0;
    let tempLvl = currentLvl;
    for (let i = 0; i < levelsGained; i++) {
        totalStatInc += (1 + Math.floor((tempLvl - 1) / 5));
        tempLvl++;
    }

    await pool.execute(
      `UPDATE specie SET 
        lvl = ?, xp = ?, 
        base_health = base_health + ?, 
        base_strength = base_strength + ?, 
        base_agility = base_agility + ?, 
        base_luck = base_luck + ?, 
        base_resistance = base_resistance + ?
       WHERE id = ?`,
      [lvl, xp, totalStatInc, totalStatInc, totalStatInc, totalStatInc, totalStatInc, specieId]
    );
    return { lvl, xp, leveledUp: true, increase: totalStatInc };
  } else {
    await pool.execute('UPDATE specie SET xp = ? WHERE id = ?', [xp, specieId]);
    return { lvl, xp, leveledUp: false };
  }
}

/** Load inventory JSON for a given specie (character) id */
async function loadInventory(pool, specieId) {
  const [rows] = await pool.execute(
    'SELECT inventory_json, stamina FROM specie WHERE id = ?',
    [specieId]
  );
  if (!rows[0]) return null;

  // Default structure
  let inv = {
    capacity: 200,
    used: 0,
    currency: { normal: 0, spec: 0 },
    items: [],
    equipped: {
      weapon: null,
      armor_cap: null,
      armor_plate: null,
      armor_leggings: null,
      armor_boots: null,
    },
    stamina: {
      current: 100,
      max: 100,
      last_reset: Math.floor(Date.now() / 1000)
    },
    active_quest: null
  };

  const raw = rows[0].inventory_json;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const parsedStamina = parsed.stamina || {};

      inv = { ...inv, ...parsed };

      // Deep merge stamina so we don't drop fields. Prioritize the DB specie.stamina column if it exists.
      inv.stamina = {
        current: rows[0].stamina !== null && rows[0].stamina !== undefined ? Number(rows[0].stamina) :
          (parsedStamina.current !== undefined ? Number(parsedStamina.current) : 100),
        max: parsedStamina.max !== undefined ? Number(parsedStamina.max) : 100,
        last_reset: parsedStamina.last_reset ? Number(parsedStamina.last_reset) : Math.floor(Date.now() / 1000)
      };

      if (inv.active_quest === undefined) inv.active_quest = null;
    } catch { }
  }

  // Handle stamina refresh
  const nowStr = Math.floor(Date.now() / 1000);
  if (nowStr - inv.stamina.last_reset >= 86400) {
    inv.stamina.current = inv.stamina.max;
    inv.stamina.last_reset = nowStr;
    await saveInventory(pool, specieId, inv);
  }

  return inv;
}

/** Persist inventory JSON back to the database */
async function saveInventory(pool, specieId, inventory) {
  // Sync stamina column
  const staminaVal = inventory.stamina && inventory.stamina.current !== undefined ? inventory.stamina.current : 100;

  await pool.execute(
    'UPDATE specie SET inventory_json = ?, stamina = ? WHERE id = ?',
    [JSON.stringify(inventory), staminaVal, specieId]
  );
}

/** Recalculate the `used` field (1 slot per unique stack) */
function recalcUsed(inventory) {
  // Each stack takes exactly its inventory_size, regardless of quantity within the stack
  inventory.used = inventory.items.reduce((sum, item) => sum + (item.inventory_size || 10), 0);
}

// ─── Middleware ───────────────────────────────────────────────────────────────
router.use(authMiddleware);

// ─── GET /api/inventory ───────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Character not found' });
    res.json({ success: true, data: inv });
  } catch (err) {
    console.error('[Inventory] GET / error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/inventory/player ────────────────────────────────────────────────
router.get('/player', async (req, res) => {
  try {
    const [rows] = await req.pool.execute(
      `SELECT s.id, s.specie_name, s.hair_style, s.beard_style,
              s.lvl, s.xp,
              s.base_health, s.base_strength, s.base_agility, s.base_luck, s.base_resistance, s.base_armor,
              s.created_at,
              u.nickname
       FROM specie s
       JOIN user u ON u.specie_id = s.id
       WHERE s.id = ?`,
      [req.user.specieId]
    );

    const row = rows[0];
    if (!row) return res.status(404).json({ success: false, message: 'Player not found' });

    const lvl = row.lvl || 1;
    const xp = row.xp || 0;
    const xpForNext = lvl * 100;

    res.json({
      success: true,
      data: {
        id: row.id,
        name: row.nickname,
        class: row.specie_name || 'Neanderthal',
        hairStyle: row.hair_style || 0,
        beardStyle: row.beard_style || 0,
        lvl,
        xp,
        xpForNext,
        stats: {
          health: row.base_health || 0,
          strength: row.base_strength || 0,
          agility: row.base_agility || 0,
          luck: row.base_luck || 0,
          resistance: row.base_resistance || 0,
          armor: row.base_armor || 0
        },
        createdAt: row.created_at
      },
    });
  } catch (err) {
    console.error('[Inventory] GET /player error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/stats/upgrade ────────────────────────────────────────
router.post('/stats/upgrade', async (req, res) => {
  try {
    const { statKey } = req.body;
    const validStats = ['strength', 'agility', 'luck', 'resistance', 'health'];
    if (!validStats.includes(statKey)) {
      return res.status(400).json({ success: false, message: 'Invalid stat key: ' + statKey });
    }

    const pool = req.pool;

    // Fetch current stat value
    const statCol = `base_${statKey}`;
    const [rows] = await pool.execute(
      `SELECT ${statCol} FROM specie WHERE id = ?`,
      [req.user.specieId]
    );

    if (!rows[0]) return res.status(404).json({ success: false, message: 'Character not found' });

    const [lvlRows] = await pool.execute(`SELECT lvl FROM specie WHERE id = ?`, [req.user.specieId]);
    const playerLevel = lvlRows[0]?.lvl || 1;

    const currentVal = rows[0][statCol] || 0;
    // Scaled cost: base 10 + (stat * 10) + (level * 20)
    const cost = Math.max(10, (currentVal * 10) + (playerLevel * 20)); 

    // Deduct cost
    const inv = await loadInventory(pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    if ((inv.currency.normal || 0) < cost) {
      return res.status(400).json({ success: false, message: `Not enough river pebbles! need ${cost}` });
    }

    inv.currency.normal -= cost;
    await saveInventory(pool, req.user.specieId, inv);

    // Upgrade stat
    await pool.execute(
      `UPDATE specie SET ${statCol} = ${statCol} + 1 WHERE id = ?`,
      [req.user.specieId]
    );

    res.json({ success: true, message: `Upgraded ${statKey} to ${currentVal + 1} for ${cost} river pebble(s)` });
  } catch (err) {
    console.error('[Inventory] POST /stats/upgrade error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/equip ────────────────────────────────────────────────
router.post('/equip', async (req, res) => {
  try {
    const { slot, itemId } = req.body;
    const fs = require('fs');
    if (!slot || itemId == null) {
      fs.appendFileSync('equip_debug.log', `[400] Missing slot or itemId -> slot: ${slot}, itemId: ${itemId}\n`);
      return res.status(400).json({ success: false, message: 'Missing: slot, itemId' });
    }

    const validSlots = ['weapon', 'armor_cap', 'armor_plate', 'armor_leggings', 'armor_boots'];
    if (!validSlots.includes(slot)) {
      fs.appendFileSync('equip_debug.log', `[400] Invalid slot -> slot: ${slot}\n`);
      return res.status(400).json({ success: false, message: 'Invalid equipment slot: ' + slot });
    }

    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    const expectedType = slot === 'weapon' ? 'weapon' : (slot.startsWith('armor_') ? 'armor' : null);

    let itemIdx = inv.items.findIndex(i => i.id == itemId && (expectedType ? i.type === expectedType : true));

    // Fallback if not found by type natively, just in case (e.g. capitalized legacy types)
    if (itemIdx === -1) {
      itemIdx = inv.items.findIndex(i => i.id == itemId && (expectedType ? (i.type || '').toLowerCase() === expectedType : true));
    }

    if (itemIdx === -1) {
      fs.appendFileSync('equip_debug.log', `[400] Item not found -> itemId: ${itemId}, items: ${JSON.stringify(inv.items.map(i => ({ id: i.id, type: i.type, name: i.name })))}\n`);
      return res.status(400).json({ success: false, message: 'Item not found in inventory' });
    }
    const item = inv.items[itemIdx];

    const normalizedType = (item.type || '').toLowerCase();
    if (slot === 'weapon' && normalizedType !== 'weapon') {
      fs.appendFileSync('equip_debug.log', `[400] Not a weapon -> itemId: ${itemId}, type: ${item.type}\n`);
      return res.status(400).json({ success: false, message: 'Item is not a weapon' });
    }
    if (slot.startsWith('armor_') && normalizedType !== 'armor') {
      fs.appendFileSync('equip_debug.log', `[400] Not an armor -> itemId: ${itemId}, type: ${item.type}\n`);
      return res.status(400).json({ success: false, message: 'Item is not armor' });
    }

    // If something is already in this slot, push it back to items first
    const currentlyEquipped = inv.equipped[slot];
    if (currentlyEquipped && typeof currentlyEquipped === 'object') {
      const existing = inv.items.find(i => i.id == currentlyEquipped.id && i.type === currentlyEquipped.type);
      if (existing) {
        existing.quantity += 1;
      } else {
        inv.items.push(currentlyEquipped);
      }
    }

    // Move item from items[] into the equipped slot
    if (item.quantity > 1) {
      inv.items[itemIdx].quantity -= 1;
      const equippedObj = { ...item, quantity: 1 };
      inv.equipped[slot] = equippedObj;
    } else {
      // Remove from items array entirely
      inv.items.splice(itemIdx, 1);
      inv.equipped[slot] = { ...item, quantity: 1 };
    }

    recalcUsed(inv);
    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, message: 'Item equipped', inventory: inv });
  } catch (err) {
    console.error('[Inventory] POST /equip error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/unequip ─────────────────────────────────────────────
router.post('/unequip', async (req, res) => {
  try {
    const { slot } = req.body;
    if (!slot)
      return res.status(400).json({ success: false, message: 'Missing: slot' });

    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    const equippedItem = inv.equipped[slot];
    if (!equippedItem)
      return res.status(400).json({ success: false, message: 'Slot is already empty' });

    // Put the item back into the bag
    if (typeof equippedItem === 'object') {
      const existing = inv.items.find(i => i.id == equippedItem.id && i.type === equippedItem.type);
      if (existing) {
        existing.quantity += 1;
      } else {
        inv.items.push(equippedItem);
      }
    }

    inv.equipped[slot] = null;
    recalcUsed(inv);
    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, message: 'Item unequipped', inventory: inv });
  } catch (err) {
    console.error('[Inventory] POST /unequip error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/sell ─────────────────────────────────────────────────
router.post('/sell', async (req, res) => {
  try {
    const { itemType, itemId, quantity = 1 } = req.body;
    if (!itemType || itemId == null)
      return res.status(400).json({ success: false, message: 'Missing: itemType, itemId' });

    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    const normalizedReqType = (itemType || '').toLowerCase();
    const idx = inv.items.findIndex(i => i.id == itemId && (i.type || '').toLowerCase() === normalizedReqType);
    if (idx === -1)
      return res.status(400).json({ success: false, message: 'Item not found' });

    const item = inv.items[idx];
    // Check if item is equipped (now stored as objects), taking type into account to prevent legacy ID collisions
    const isEquipped = Object.values(inv.equipped || {}).some(
      e => e && typeof e === 'object' && e.id == item.id && (e.type || '').toLowerCase() === (item.type || '').toLowerCase()
    );
    if (isEquipped)
      return res.status(400).json({ success: false, message: 'Cannot sell an equipped item' });

    const sellQty = Math.min(quantity, item.quantity);

    // Look up costs from the DB for dynamic pricing
    let sellPrice = 0;
    const lookupId = item.item_id != null ? item.item_id : item.id;
    const normalizedType = (item.type || '').toLowerCase();

    if (lookupId != null) {
      const tableMap = { weapon: 'item_weapon', armor: 'item_armor', food: 'item_food', misc: 'item_misc' };
      const table = tableMap[normalizedType];
      if (table) {
        // None of the tables have 'sell_price'. Everything uses 'normal_currency_cost'.
        const [dbRows] = await req.pool.execute(
          `SELECT normal_currency_cost FROM ${table} WHERE item_id = ?`,
          [lookupId]
        );

        if (dbRows.length > 0) {
          const row = dbRows[0];
          const [specRows] = await req.pool.execute('SELECT lvl FROM specie WHERE id = ?', [req.user.specieId]);
          const playerLevel = specRows[0]?.lvl || 1;
          const baseCost = row.normal_currency_cost || 0;

          if (normalizedType === 'misc') {
            // Misc items scale directly from the DB base cost
            sellPrice = Math.round(baseCost * (1 + playerLevel * 0.2));
          } else {
            // Equipment and food resell for 40% of their generated shop price
            const dynamicBuyPrice = Math.round((baseCost * (1 + playerLevel * 0.2)) * (1 + playerLevel / 5));
            sellPrice = Math.round(dynamicBuyPrice * 0.40);
          }
        }
      }
    }

    // Fallback if DB lookup failed or calculated 0
    if (sellPrice === 0) {
      sellPrice = item.sell_price || 0;
    }
    // Hard fallback so players don't get 0 for selling
    if (sellPrice === 0) {
      sellPrice = 1;
    }

    sellPrice = sellPrice * sellQty;

    item.quantity -= sellQty;
    if (item.quantity <= 0) inv.items.splice(idx, 1);

    inv.currency.normal = (inv.currency.normal || 0) + sellPrice;
    recalcUsed(inv);

    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, message: `Sold for ${sellPrice} river pebble${sellPrice > 1 ? 's' : ''}` });
  } catch (err) {
    console.error('[Inventory] POST /sell error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ─── POST /api/inventory/use ──────────────────────────────────────────────────
router.post('/use', async (req, res) => {
  try {
    const { itemId } = req.body;
    if (itemId == null) return res.status(400).json({ success: false, message: 'Missing: itemId' });

    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    const idx = inv.items.findIndex(i => i.id == itemId && i.type === 'food');
    if (idx === -1) return res.status(400).json({ success: false, message: 'Food item not found' });

    const item = inv.items[idx];
    const buffId = item.buff_id;

    // Consume item
    item.quantity -= 1;
    if (item.quantity <= 0) inv.items.splice(idx, 1);
    recalcUsed(inv);
    await saveInventory(req.pool, req.user.specieId, inv);

    // Apply buff
    if (buffId) {
      await req.pool.execute(
        `INSERT INTO active_effect (specie_id, buff_id, start_date) 
         VALUES (?, ?, CURRENT_TIMESTAMP) 
         ON DUPLICATE KEY UPDATE start_date = CURRENT_TIMESTAMP`,
        [req.user.specieId, buffId]
      );
    }

    res.json({ success: true, message: `Used ${item.name}` });
  } catch (err) {
    console.error('[Inventory] POST /use error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/addItem ─────────────────────────────────────────────
router.post('/addItem', async (req, res) => {
  try {
    const { itemType, itemId, quantity = 1, itemData } = req.body;
    if (!itemType || itemId == null)
      return res.status(400).json({ success: false, message: 'Missing: itemType, itemId' });

    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    // Get Specie Level for weapon damage calculation
    const [lvlRows] = await req.pool.execute('SELECT lvl FROM specie WHERE id = ?', [req.user.specieId]);
    const sLvl = lvlRows[0]?.lvl || 1;

    const existing = inv.items.find(i => i.id == itemId && i.type === itemType);
    if (existing) {
      existing.quantity += quantity;
    } else {
      let weapon_damage = 0;
      if (itemType === 'weapon') {
        const bDmg = itemData?.base_damage || 10;
        // weapon_damage = base_damage + random(-1, 1) + (specie.lvl * 2)
        weapon_damage = itemData?.weapon_damage || (bDmg + (Math.floor(Math.random() * 3) - 1) + (sLvl * 2));
      }

      inv.items.push({
        id: itemId,
        type: itemType,
        name: itemData?.name || 'Unknown Item',
        rarity: itemData?.rarity || 'common',
        quantity,
        description: itemData?.description || '',
        sell_price: itemData?.sell_price || 0,
        iconPath: itemData?.iconPath || null,
        inventory_size: itemData?.inventory_size || 10,
        ...(itemType === 'weapon' && { base_damage: itemData?.base_damage || 0, weapon_damage }),
        ...(itemType === 'armor' && { armor_point: itemData?.armor_point || 0, category: itemData?.category || 'Armor' }),
        ...(itemType === 'food' && { category: itemData?.category || '', buff_id: itemData?.buff_id || null }),
      });
    }

    recalcUsed(inv);
    if (inv.used > inv.capacity)
      return res.status(400).json({ success: false, message: 'Not enough space in inventory' });

    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, message: 'Item added successfully' });
  } catch (err) {
    console.error('[Inventory] POST /addItem error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/removeItem ──────────────────────────────────────────
router.post('/removeItem', async (req, res) => {
  try {
    const { itemType, itemId, quantity = 1 } = req.body;
    if (!itemType || itemId == null)
      return res.status(400).json({ success: false, message: 'Missing: itemType, itemId' });

    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    const idx = inv.items.findIndex(i => i.id == itemId && i.type === itemType);
    if (idx === -1)
      return res.status(400).json({ success: false, message: 'Item not found' });

    inv.items[idx].quantity -= quantity;
    if (inv.items[idx].quantity <= 0) inv.items.splice(idx, 1);

    recalcUsed(inv);
    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, message: 'Item removed successfully' });
  } catch (err) {
    console.error('[Inventory] POST /removeItem error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/currency/add ────────────────────────────────────────
router.post('/currency/add', async (req, res) => {
  try {
    const { normal = 0, spec = 0 } = req.body;
    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    inv.currency.normal += Number(normal);
    inv.currency.spec += Number(spec);
    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, message: 'Currency added' });
  } catch (err) {
    console.error('[Inventory] POST /currency/add error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/currency/remove ─────────────────────────────────────
router.post('/currency/remove', async (req, res) => {
  try {
    const { normal = 0, spec = 0 } = req.body;
    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    if (inv.currency.normal < Number(normal) || inv.currency.spec < Number(spec))
      return res.status(400).json({ success: false, message: 'Insufficient currency' });

    inv.currency.normal -= Number(normal);
    inv.currency.spec -= Number(spec);
    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, message: 'Currency removed' });
  } catch (err) {
    console.error('[Inventory] POST /currency/remove error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/quest/complete ──────────────────────────────────────
router.post('/quest/complete', async (req, res) => {
  try {
    const { questId } = req.body;
    if (!questId)
      return res.status(400).json({ success: false, message: 'Missing: questId' });

    const pool = req.pool;

    const [quests] = await pool.execute(
      'SELECT * FROM quest WHERE quest_id = ?',
      [questId]
    );
    const quest = quests[0];
    if (!quest)
      return res.status(404).json({ success: false, message: 'Quest not found' });

    // Add currency to inventory
    const inv = await loadInventory(pool, req.user.specieId);
    if (inv) {
      inv.currency.normal = (inv.currency.normal || 0) + (quest.currency || 0);
      inv.currency.spec = (inv.currency.spec || 0) + (quest.spec_currency || 0);
      await saveInventory(pool, req.user.specieId, inv);
    }

    // Add XP and handle level up
    const xpToAdd = quest.xp || 0;
    if (xpToAdd > 0) {
      const [specRows] = await pool.execute(
        'SELECT lvl, xp FROM specie WHERE id = ?',
        [req.user.specieId]
      );
      if (specRows[0]) {
        await handleLevelUp(pool, req.user.specieId, specRows[0].lvl, specRows[0].xp, xpToAdd);
      }
    }

    res.json({ success: true, message: 'Quest completed!' });
  } catch (err) {
    console.error('[Inventory] POST /quest/complete error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/quest/start ─────────────────────────────────────────
router.post('/quest/start', async (req, res) => {
  try {
    const { questName, difficulty, staminaCost, duration, rewardNormal, rewardSpec, rewardXP, background } = req.body;
    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    if (inv.active_quest !== null) return res.status(400).json({ success: false, message: 'A quest is already active' });
    if (inv.stamina.current < staminaCost) return res.status(400).json({ success: false, message: 'Not enough stamina' });

    let durationSeconds = 60;
    const match = duration.match(/(?:(\d+)m)?\s*(?:(\d+)s)?/);
    if (match) {
      const m = match[1] ? parseInt(match[1]) : 0;
      const s = match[2] ? parseInt(match[2]) : 0;
      if (m > 0 || s > 0) durationSeconds = (m * 60) + s;
    }

    inv.stamina.current -= (Number(staminaCost) || 0);
    inv.active_quest = {
      name: questName,
      difficulty,
      start_time: Math.floor(Date.now() / 1000),
      duration: durationSeconds,
      reward_normal: rewardNormal,
      reward_spec: rewardSpec,
      reward_xp: Number(rewardXP) || 0,
      background: background || null
    };

    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, data: inv.active_quest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/quest/claim ─────────────────────────────────────────
router.post('/quest/claim', async (req, res) => {
  try {
    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv || !inv.active_quest) return res.status(400).json({ success: false, message: 'No active quest' });

    const q = inv.active_quest;
    const now = Math.floor(Date.now() / 1000);
    if (now < q.start_time + q.duration) return res.status(400).json({ success: false, message: 'Quest not finished yet' });

    inv.currency.normal = (inv.currency.normal || 0) + q.reward_normal;
    inv.currency.spec = (inv.currency.spec || 0) + q.reward_spec;
    const questXP = q.reward_xp || 0;
    inv.active_quest = null;

    // Award XP and handle level up
    const [specRows] = await req.pool.execute('SELECT lvl, xp FROM specie WHERE id = ?', [req.user.specieId]);
    let levelMsg = "";
    if (specRows[0]) {
      const result = await handleLevelUp(req.pool, req.user.specieId, specRows[0].lvl, specRows[0].xp, questXP);
      if (result.leveledUp) {
          levelMsg = ` Level up! Reached level ${result.lvl}. All stats +${result.increase}!`;
      }
    }

    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ 
        success: true, 
        message: `Quest claimed! +${q.reward_normal} pebbles, +${questXP} XP.${levelMsg}`,
        rewards: { normal: q.reward_normal, spec: q.reward_spec, xp: questXP } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/quest/skip ─────────────────────────────────────────
router.post('/quest/skip', async (req, res) => {
  try {
    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv || !inv.active_quest) return res.status(400).json({ success: false, message: 'No active quest' });

    inv.active_quest.start_time = Math.floor(Date.now() / 1000) - inv.active_quest.duration - 10;
    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, message: 'Skipped' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/quest/fail ─────────────────────────────────────────
router.post('/quest/fail', async (req, res) => {
  try {
    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv || !inv.active_quest) return res.status(400).json({ success: false, message: 'No active quest' });

    inv.active_quest = null;
    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, message: 'Quest failed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/quest/restore-stamina ────────────────────────────
router.post('/quest/restore-stamina', async (req, res) => {
  try {
    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    inv.stamina.current = inv.stamina.max || 100;
    inv.stamina.last_reset = Math.floor(Date.now() / 1000);

    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, stamina: inv.stamina });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;