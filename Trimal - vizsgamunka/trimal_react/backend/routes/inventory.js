// backend/routes/inventory.js


const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// ─── Elemental Buff Definíciók ───────────────────────────────────────────────
const ELEMENTAL_BUFFS = [
  { type: 'poison', label: 'Poison', color: '#4ade80', dmgPerTick: 3, ticks: 3, description: 'Deals poison damage over 3 turns' },
  { type: 'cold', label: 'Frost', color: '#60a5fa', dmgPerTick: 2, ticks: 4, description: 'Deals frost damage over 4 turns' },
  { type: 'bleed', label: 'Bleed', color: '#f87171', dmgPerTick: 4, ticks: 2, description: 'Causes bleeding for 2 turns' },
];

function rollElementalBuffRandom(playerLevel) {
  if (Math.random() > 0.15) return null;
  const base = ELEMENTAL_BUFFS[Math.floor(Math.random() * ELEMENTAL_BUFFS.length)];
  const scaledDmgPerTick = base.dmgPerTick + Math.floor(playerLevel / 5);
  return {
    type: base.type,
    label: base.label,
    color: base.color,
    dmgPerTick: scaledDmgPerTick,
    ticks: base.ticks,
    totalDot: scaledDmgPerTick * base.ticks,
    description: base.description,
  };
}

// ─── Segédfüggvények ──────────────────────────────────────────────────────────────────

/** Level-up kezelés: növeli a statokat és az XP küszöböt */
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
    // Stat növelés: +1 mindegyiknek, minden 5. szinten a növekedés nő 1-gyel
    // 1-5: +1, 6-10: +2, 11-15: +3, stb.
    const statIncrease = 1 + Math.floor((lvl - 1 - levelsGained) / 5);

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

/** Inventory JSON betöltése egy adott specie (character) id alapján */
async function loadInventory(pool, specieId) {
  const [rows] = await pool.execute(
    'SELECT inventory_json, stamina FROM specie WHERE id = ?',
    [specieId]
  );
  if (!rows[0]) return null;

  // Default struktúra
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
    active_quest: null,
    active_buffs: [],
    achievements: {
      enemiesEnc: [],
      weaponsEnc: [],
      armorsEnc: [],
      foodsEnc: [],
      maxCrits: 0,
      flawlessWins: 0,
      deaths: 0,
      spentNormal: 0,
      foundLegendary: false,
      hoarderAchieved: false
    }
  };

  const raw = rows[0].inventory_json;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const parsedStamina = parsed.stamina || {};

      inv = { ...inv, ...parsed };

      // Migálja a meglévő játékosokat: tartsa meg a beágyazott achievements mezőket
      if (parsed.achievements) {
        inv.achievements = { ...inv.achievements, ...parsed.achievements };
      }

      // Deep merge stamina, hogy ne dobjunk ki mezőket. Priorizáljuk a DB specie.stamina oszlopát, ha létezik.
      inv.stamina = {
        current: rows[0].stamina !== null && rows[0].stamina !== undefined ? Number(rows[0].stamina) :
          (parsedStamina.current !== undefined ? Number(parsedStamina.current) : 100),
        max: parsedStamina.max !== undefined ? Number(parsedStamina.max) : 100,
        last_reset: parsedStamina.last_reset ? Number(parsedStamina.last_reset) : Math.floor(Date.now() / 1000)
      };

      if (inv.active_quest === undefined) inv.active_quest = null;
      if (!Array.isArray(inv.active_buffs)) inv.active_buffs = [];
    } catch { }
  }

  // Kezeli a stamina frissítését és a lejárt buffok eltávolítását
  const nowStr = Math.floor(Date.now() / 1000);
  let changed = false;

  // Éjféli alapú napi reset: naptári dátumok összehasonlítása (szerver helyi ideje)
  const lastResetDate = new Date(inv.stamina.last_reset * 1000);
  const nowDate = new Date();
  const isSameDay =
    lastResetDate.getFullYear() === nowDate.getFullYear() &&
    lastResetDate.getMonth() === nowDate.getMonth() &&
    lastResetDate.getDate() === nowDate.getDate();

  if (!isSameDay) {
    inv.stamina.current = inv.stamina.max;
    inv.stamina.last_reset = nowStr;
    changed = true;
  }

  const validBuffs = inv.active_buffs.filter(b => b.expires_at > nowStr);
  if (validBuffs.length !== inv.active_buffs.length) {
    inv.active_buffs = validBuffs;
    changed = true;
  }

  // Kezeli a dungeon unlock perzisztenciát
  if (!inv.dungeons_unlocked) {
    const hasScript = (inv.items || []).some(
      i => i.type === 'misc' && (i.name || '').toLowerCase().includes('dungeon')
    );
    if (hasScript) {
      inv.dungeons_unlocked = true;
      changed = true;
    }
  }

  if (changed) {
    await saveInventory(pool, specieId, inv);
  }

  return inv;
}

/** Inventory JSON mentése */
async function saveInventory(pool, specieId, inventory) {
  // Sync stamina oszlop
  const staminaVal = inventory.stamina && inventory.stamina.current !== undefined ? inventory.stamina.current : 100;

  await pool.execute(
    'UPDATE specie SET inventory_json = ?, stamina = ? WHERE id = ?',
    [JSON.stringify(inventory), staminaVal, specieId]
  );
}

/** Újra számolja a `used` mezőt (1 slot per egyedi stack) */
function recalcUsed(inventory) {
  // Minden stack pontosan az inventory_size-t foglalja, a stack-en belüli mennyiségtől függetlenül
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

    // Lekéri a current stat értéket
    const statCol = `base_${statKey}`;
    const [rows] = await pool.execute(
      `SELECT ${statCol} FROM specie WHERE id = ?`,
      [req.user.specieId]
    );

    if (!rows[0]) return res.status(404).json({ success: false, message: 'Character not found' });

    const [lvlRows] = await pool.execute(`SELECT lvl FROM specie WHERE id = ?`, [req.user.specieId]);
    const playerLevel = lvlRows[0]?.lvl || 1;

    const currentVal = rows[0][statCol] || 0;
    // Skalázott költség: kvadratikus növekedés a stat szerint + lineáris növekedés a szint szerint
    const cost = Math.max(10, Math.floor(currentVal * currentVal * 0.16 + playerLevel * 2));

    // Deduct ár
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

    // Ha nem található a típus szerint, akkor keress rá (pl. nagybetűs legacy type-ok miatt)
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

    // Ha valami már ebben a slotban van, először tedd vissza a tételeket
    const currentlyEquipped = inv.equipped[slot];
    if (currentlyEquipped && typeof currentlyEquipped === 'object') {
      const existing = inv.items.find(i => i.id == currentlyEquipped.id && i.type === currentlyEquipped.type);
      if (existing) {
        existing.quantity += 1;
      } else {
        inv.items.push(currentlyEquipped);
      }
    }

    // Tárgy mozgatása az items[] tömbből az equipped slotba
    if (item.quantity > 1) {
      inv.items[itemIdx].quantity -= 1;
      const equippedObj = { ...item, quantity: 1 };
      inv.equipped[slot] = equippedObj;
    } else {
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

    // Tedd vissza a tárgyat a bagbe
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
    // Ellenőrizze, hogy a tárgy fel van-e szerelve (ez most objektumként van tárolva), figyelembe véve a típust az örökölt ID-ütközések megelőzése érdekében
    const isEquipped = Object.values(inv.equipped || {}).some(
      e => e && typeof e === 'object' && e.id == item.id && (e.type || '').toLowerCase() === (item.type || '').toLowerCase()
    );
    if (isEquipped)
      return res.status(400).json({ success: false, message: 'Cannot sell an equipped item' });

    const sellQty = Math.min(quantity, item.quantity);

    // Keresd meg a költségeket az adatbázisban az dinamikus árazáshoz
    let sellPrice = 0;
    const lookupId = item.item_id != null ? item.item_id : item.id;
    const normalizedType = (item.type || '').toLowerCase();

    if (lookupId != null) {
      const tableMap = { weapon: 'item_weapon', armor: 'item_armor', food: 'item_food', misc: 'item_misc' };
      const table = tableMap[normalizedType];
      if (table) {
        // Az egyik táblának sincs 'sell_price'. Mindenhol 'normal_currency_cost' használatos.
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
            // A misc tételek közvetlenül a DB alapárról skálázódnak
            sellPrice = Math.round(baseCost * (1 + playerLevel * 0.04));
          } else {
            // A felszerelés és az étel a generált bolti ár 40%-ért kerül értékesítésre
            const dynamicBuyPrice = Math.round(baseCost * (1 + playerLevel * 0.04));
            sellPrice = Math.round(dynamicBuyPrice * 0.40);
          }
        }
      }
    }

    // Visszatérési érték, ha az adatbázis lekérdezése sikertelen vagy 0-t számított ki
    if (sellPrice === 0) {
      sellPrice = item.sell_price || 0;
    }
    // Hard fallback, így a játékosok nem kapnak 0-t az eladáshoz
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
    const { itemId, confirmOverwrite } = req.body;
    if (itemId == null) return res.status(400).json({ success: false, message: 'Missing: itemId' });

    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    const idx = inv.items.findIndex(i => i.id == itemId && i.type === 'food');
    if (idx === -1) return res.status(400).json({ success: false, message: 'Food item not found' });

    const item = inv.items[idx];
    const category = item.category || 'health';
    const rarity = (item.rarity || 'common').toLowerCase();

    // Ellenőrizze a buffok maximális számát (max 2)
    if (inv.active_buffs.length >= 2 && !inv.active_buffs.find(b => b.category === category)) {
      return res.status(400).json({ success: false, message: 'Maximum 2 buff can be active at the same time!' });
    }

    const existingIdx = inv.active_buffs.findIndex(b => b.category === category);
    if (existingIdx !== -1 && !confirmOverwrite) {
      return res.json({
        success: false,
        requireConfirmation: true,
        message: `There's already an active ${category} buff! Do you want to overwrite it?`
      });
    }

    // Rarity mappings
    let durationSeconds = 1800; // Ritka (30m)
    let percentIncrease = 5;    // Ritka
    if (rarity === 'epic') {
      durationSeconds = 7200; // 2h
      percentIncrease = 8;
    } else if (rarity === 'legendary') {
      durationSeconds = 14400; // 4h
      percentIncrease = 10;
    }

    if (existingIdx !== -1) {
      inv.active_buffs.splice(existingIdx, 1);
    }

    inv.active_buffs.push({
      category: category,
      percent: percentIncrease,
      expires_at: Math.floor(Date.now() / 1000) + durationSeconds,
      iconPath: item.iconPath,
      rarity: rarity
    });

    // Item fogyasztás
    item.quantity -= 1;
    if (item.quantity <= 0) inv.items.splice(idx, 1);
    recalcUsed(inv);
    await saveInventory(req.pool, req.user.specieId, inv);

    // A régi DB tábla beszúrása abban az esetben, ha a régi rendszerek ellenőrzik azt (opcionális)
    if (item.buff_id) {
      await req.pool.execute(
        `INSERT INTO active_effect (specie_id, buff_id, start_date) 
         VALUES (?, ?, CURRENT_TIMESTAMP) 
         ON DUPLICATE KEY UPDATE start_date = CURRENT_TIMESTAMP`,
        [req.user.specieId, item.buff_id]
      ).catch(e => console.error(e)); // Error ignorálás
    }

    res.json({ success: true, message: `Used ${item.name}`, active_buffs: inv.active_buffs });
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

    // A fegyver sebességének kiszámításához a faj szintjének megszerzése
    const [lvlRows] = await req.pool.execute('SELECT lvl FROM specie WHERE id = ?', [req.user.specieId]);
    const sLvl = lvlRows[0]?.lvl || 1;

    const existing = inv.items.find(i => i.id == itemId && i.type === itemType);
    if (existing) {
      existing.quantity += quantity;
    } else {
      let weapon_damage = 0;
      let armor_point = 0;
      let elemental_buff = null;
      if (itemType === 'weapon') {
        const bDmg = itemData?.base_damage || 10;
        const offset = Math.floor(Math.random() * 14) - 5; // -5 to +8
        weapon_damage = itemData?.weapon_damage || (bDmg + offset + (sLvl * 2));

        //Elemantal buff dobás sebesség csökkentéssel
        elemental_buff = rollElementalBuffRandom(sLvl);
        if (elemental_buff) {
          const reduction = 0.15 + (Math.random() * 0.15); // 15-30% reduktálás
          weapon_damage = Math.max(1, Math.floor(weapon_damage * (1 - reduction)));
        }
      } else if (itemType === 'armor') {
        const bArm = itemData?.armor_point || 18;
        const offset = Math.floor(Math.random() * 11) - 4; // -4-től +6-ig
        armor_point = itemData?.armor_point || (bArm + offset);
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
        ...(itemType === 'weapon' && { base_damage: itemData?.base_damage || 0, weapon_damage, ...(elemental_buff ? { elemental_buff } : {}) }),
        ...(itemType === 'armor' && { armor_point, category: itemData?.category || 'Armor' }),
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

    // Pénz hozzáadása a készlethez
    const inv = await loadInventory(pool, req.user.specieId);
    if (inv) {
      inv.currency.normal = (inv.currency.normal || 0) + (quest.currency || 0);
      inv.currency.spec = (inv.currency.spec || 0) + (quest.spec_currency || 0);
      await saveInventory(pool, req.user.specieId, inv);
    }

    // XP hozzáadása és szintlépés kezelése
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
    const [statsRows] = await req.pool.execute('SELECT base_agility, base_luck FROM specie WHERE id = ?', [req.user.specieId]);
    const agility = statsRows[0]?.base_agility || 10;
    const luck = statsRows[0]?.base_luck || 10;
    const combinedStats = agility + luck;

    let discount = 0;
    // 15% esély egy gyorsítószer megtalálására, növeli a szerencse
    const chance = 0.15 + Math.min(0.25, (luck / 100));
    if (Math.random() < chance) {
      // Minimal csökkentés: 1% 10 kombinált pontonként, max 25%
      discount = Math.min(0.25, (combinedStats / 10) * 0.01);
    }

    const originalDuration = durationSeconds;
    durationSeconds = Math.floor(durationSeconds * (1 - discount));

    inv.active_quest = {
      name: questName,
      difficulty,
      description: req.body.description || '',
      start_time: Math.floor(Date.now() / 1000),
      duration: durationSeconds,
      original_duration: originalDuration,
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

    // Harci eredmények nyomon követése a kéréstörzséből
    const achData = req.body.achievementsData || {};
    if (achData.maxCrits > inv.achievements.maxCrits) inv.achievements.maxCrits = achData.maxCrits;
    if (achData.flawlessWin) inv.achievements.flawlessWins += 1;
    if (achData.enemyEncountered && !inv.achievements.enemiesEnc.includes(achData.enemyEncountered)) {
      inv.achievements.enemiesEnc.push(achData.enemyEncountered);
    }

    const q = inv.active_quest;
    const diff = (q.difficulty || 'medium').toLowerCase();
    const now = Math.floor(Date.now() / 1000);
    // A börtönök átugorják az idő ellenőrzést (egyenesen a harcba mennek, időtartam = 1)
    if (!q.isDungeon && now < q.start_time + q.duration) return res.status(400).json({ success: false, message: 'Quest not finished yet' });

    inv.currency.normal = (inv.currency.normal || 0) + q.reward_normal;
    inv.currency.spec = (inv.currency.spec || 0) + q.reward_spec;
    // XP hozzáadása és szintlépés kezelése
    const [specRows] = await req.pool.execute('SELECT lvl, xp FROM specie WHERE id = ?', [req.user.specieId]);
    let levelMsg = "";
    let sLvlOriginal = specRows[0] ? specRows[0].lvl : 1;
    let sLvl = sLvlOriginal;
    let questXP = q.reward_xp || 0;

    // KEZDŐ BÓNSZ: az 1-3. szintű játékosok 2x XP-t kapnak
    const isBeginner = sLvlOriginal <= 3;
    if (isBeginner) {
      questXP = Math.floor(questXP * 2);
    }

    if (specRows[0]) {
      const result = await handleLevelUp(req.pool, req.user.specieId, specRows[0].lvl, specRows[0].xp, questXP);
      if (result.leveledUp) {
        levelMsg = ` Level up! Reached level ${result.lvl}. All stats +${result.increase}!`;
        sLvl = result.lvl;
      }
    }

    // Dobási rendszer logikája
    const drops = [];
    const roll = Math.random();
    let numDrops = 0;
    let allowEpicLeg = false;

    if (isBeginner) {
      // KEZDŐ BÓNSZ: Mindig 2 dobás, jobb esély a hasznos elemekre
      numDrops = 2;
      allowEpicLeg = true;
    } else if (diff === 'easy') {
      if (roll < 0.40) numDrops = 1; // 40% esély
    } else if (diff === 'medium') {
      if (roll < 0.70) numDrops = 1; // 70% esély
      allowEpicLeg = true;
    } else if (diff === 'hard') {
      numDrops = roll < 0.40 ? 2 : 1; // 100% esély 1-re, 40% 2-re
      allowEpicLeg = true;
    } else if (diff === 'dungeon') {
      numDrops = 2; // Mindig 2 dobás a börtönökben
      allowEpicLeg = true;
    }

    // A küldetés null-ra állítása az XP és a módosítók kiszámítása után
    inv.active_quest = null;

    if (numDrops > 0 && inv.used < inv.capacity) {
      // Elemek tömbjeinek betöltése
      const [miscRows] = await req.pool.execute('SELECT * FROM item_misc');
      const [weapRows] = await req.pool.execute('SELECT * FROM item_weapon WHERE rarity IN ("Common", "Rare", "common", "rare")');

      for (let i = 0; i < numDrops; i++) {
        let dbItem = null;
        let isWeap = false;

        // Nem dungeon küldetéseknél 10% esély egy Dungeon szkriptre
        if (diff !== 'dungeon' && Math.random() < 0.10) {
          const script = miscRows.find(x => (x.name || '').toLowerCase().includes('dungeon'));
          if (script) {
            dbItem = script;
            isWeap = false;
          }
        }

        if (!dbItem) {
          // 80% esélly misc, 20% esélly weapon
          isWeap = Math.random() < 0.20 && weapRows.length > 0;
          const itemsSource = isWeap ? weapRows : miscRows;

          // Ritkaság szerinti szűrés a nehézség alapján
          let possibleItems = itemsSource;
          if (!isWeap && itemsSource.length > 0) {
            const rRoll = Math.random();
            let targetRarity = 'common';
            if (diff === 'easy') {
              targetRarity = rRoll < 0.1 ? 'rare' : 'common';
            } else if (diff === 'medium') {
              targetRarity = rRoll < 0.2 ? 'rare' : (rRoll < 0.25 ? 'epic' : 'common');
            } else if (diff === 'hard') {
              targetRarity = rRoll < 0.3 ? 'rare' : (rRoll < 0.4 ? 'epic' : (rRoll < 0.45 ? 'legendary' : 'common'));
            } else if (diff === 'dungeon') {
              targetRarity = rRoll < 0.4 ? 'rare' : (rRoll < 0.7 ? 'epic' : (rRoll < 0.9 ? 'legendary' : 'common'));
            }

            const filtered = itemsSource
              .filter(x => (x.rarity || 'common').toLowerCase() === targetRarity)
              .filter(x => !(x.name || '').toLowerCase().includes('dungeon'));

            if (filtered.length > 0) possibleItems = filtered;
            else {
              possibleItems = itemsSource.filter(x => !(x.name || '').toLowerCase().includes('dungeon'));
            }
          }

          if (possibleItems.length > 0) {
            dbItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
          }
        }

        if (dbItem) {
          const invSize = dbItem.inventory_size || 10;

          if (inv.used + invSize <= inv.capacity) {
            const existing = inv.items.find(x => x.id == dbItem.item_id && x.type === (isWeap ? 'weapon' : 'misc'));
            if (existing) {
              existing.quantity += 1;
            } else {
              const newItem = {
                id: dbItem.item_id,
                type: isWeap ? 'weapon' : 'misc',
                name: dbItem.name || 'Unknown Item',
                rarity: (dbItem.rarity || 'common').toLowerCase(),
                quantity: 1,
                description: dbItem.description || '',
                sell_price: dbItem.sell_price || Math.round((dbItem.normal_currency_cost || 10) * 0.4),
                iconPath: dbItem.iconPath || null,
                inventory_size: invSize,
              };
              if (isWeap) {
                if (!inv.achievements.weaponsEnc.includes(dbItem.item_id)) inv.achievements.weaponsEnc.push(dbItem.item_id);
                const bDmg = dbItem.base_damage || 10;
                newItem.base_damage = bDmg;
                const offset = Math.floor(Math.random() * 14) - 5; // -5 to +8
                newItem.weapon_damage = bDmg + offset + (sLvl * 2);
                // Elem buff dobása
                const elemBuff = rollElementalBuffRandom(sLvl);
                if (elemBuff) {
                  const reduction = 0.15 + (Math.random() * 0.15);
                  newItem.weapon_damage = Math.max(1, Math.floor(newItem.weapon_damage * (1 - reduction)));
                  newItem.elemental_buff = elemBuff;
                }
              } else {
                if (!inv.achievements.foodsEnc.includes(dbItem.item_id)) inv.achievements.foodsEnc.push(dbItem.item_id);
                newItem.category = dbItem.category || '';
              }
              if (dbItem.rarity && dbItem.rarity.toLowerCase() === 'legendary') inv.achievements.foundLegendary = true;

              inv.items.push(newItem);
            }
            inv.used += invSize;
            if (inv.used >= inv.capacity) inv.achievements.hoarderAchieved = true;
            drops.push(dbItem.name);
          }
        }
      }
    }

    await saveInventory(req.pool, req.user.specieId, inv);

    let dropMsg = drops.length > 0 ? ` Found items: ${drops.join(', ')}!` : '';

    res.json({
      success: true,
      message: `Quest claimed! +${q.reward_normal} pebbles, +${questXP} XP.${levelMsg}${dropMsg}`,
      rewards: { normal: q.reward_normal, spec: q.reward_spec, xp: questXP, drops }
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

// ─── POST /api/inventory/dungeon/start ──────────────────────────────────────
router.post('/dungeon/start', async (req, res) => {
  try {
    const { dungeonId } = req.body;
    if (!dungeonId) return res.status(400).json({ success: false, message: 'Missing: dungeonId' });

    const DUNGEON_DATA = [
      null, // 0-index padding
      {
        id: 1, name: 'Neanderthal Valley', enemyName: 'Squab Warrior', enemyPrefix: 'n',
        bg: '/src/assets/design/backgrounds/dungeon/dungeon_level1.png',
        minLevel: 5, staminaCost: 40,
        getRewards: (lvl) => ({ normal: lvl * 15, spec: Math.floor(lvl / 2), xp: 60 })
      },
      {
        id: 2, name: 'Standing Stone Circle', enemyName: 'Lean Scout', enemyPrefix: 'hs',
        bg: '/src/assets/design/backgrounds/dungeon/dungeon_level2.png',
        minLevel: 15, staminaCost: 40,
        getRewards: (lvl) => ({ normal: lvl * 25, spec: lvl, xp: 80 })
      },
      {
        id: 3, name: 'The Hidden Lagoon', enemyName: 'Tiny Stalker', enemyPrefix: 'f',
        bg: '/src/assets/design/backgrounds/dungeon/dungeon_level3.png',
        minLevel: 30, staminaCost: 40,
        getRewards: (lvl) => ({ normal: lvl * 40, spec: lvl * 2, xp: 120 })
      },
    ];

    const dungeon = DUNGEON_DATA[dungeonId];
    if (!dungeon) return res.status(400).json({ success: false, message: 'Invalid dungeon ID' });

    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    if (inv.active_quest !== null)
      return res.status(400).json({ success: false, message: 'A quest is already active' });

    if (inv.stamina.current < dungeon.staminaCost)
      return res.status(400).json({ success: false, message: 'Not enough stamina' });

    // A játékos szintjének ellenőrzése
    const [lvlRows] = await req.pool.execute('SELECT lvl FROM specie WHERE id = ?', [req.user.specieId]);
    const playerLevel = lvlRows[0]?.lvl || 1;
    if (playerLevel < dungeon.minLevel)
      return res.status(400).json({ success: false, message: `Requires level ${dungeon.minLevel}` });

    // Dungeon script ellenőrzése a készletben
    const scriptIndex = (inv.items || []).findIndex(
      i => i.type === 'misc' && (i.name || '').toLowerCase().includes('dungeon')
    );
    if (scriptIndex === -1)
      return res.status(400).json({ success: false, message: 'You need a Dungeon Script to access dungeons' });

    // dungeon_script használás
    const scriptItem = inv.items[scriptIndex];
    scriptItem.quantity -= 1;
    if (scriptItem.quantity <= 0) {
      inv.items.splice(scriptIndex, 1);
    }
    recalcUsed(inv);

    const rewards = dungeon.getRewards(playerLevel);

    inv.stamina.current -= dungeon.staminaCost;

    inv.active_quest = {
      name: dungeon.name,
      difficulty: 'dungeon',
      description: '',
      start_time: Math.floor(Date.now() / 1000),
      duration: 1,
      original_duration: 1,
      reward_normal: rewards.normal,
      reward_spec: rewards.spec,
      reward_xp: rewards.xp,
      background: dungeon.bg,
      isDungeon: true,
      dungeonId: dungeon.id,
      enemyName: dungeon.enemyName,
      enemyPrefix: dungeon.enemyPrefix,
    };

    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, data: inv.active_quest });
  } catch (err) {
    console.error('[Dungeon] POST /dungeon/start error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/quest/fail ─────────────────────────────────────────
router.post('/quest/fail', async (req, res) => {
  try {
    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv || !inv.active_quest) return res.status(400).json({ success: false, message: 'No active quest' });

    // Track death/failure achievement
    if (inv.achievements) inv.achievements.deaths += 1;

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

// ─── POST /api/inventory/achievements/claim ─────────────────────────────────────
router.post('/achievements/claim', async (req, res) => {
  try {
    const { achId } = req.body;
    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    if (!inv.achievements.claimedRewards) inv.achievements.claimedRewards = [];
    if (inv.achievements.claimedRewards.includes(achId)) {
      return res.status(400).json({ success: false, message: 'Reward already claimed!' });
    }

    const REWARDS = {
      1: { norm: 500, spec: 10 },
      2: { norm: 1000, spec: 20 },
      3: { norm: 1000, spec: 20 },
      4: { norm: 800, spec: 15 },
      5: { norm: 300, spec: 5 },
      6: { norm: 400, spec: 10 },
      7: { norm: 1000, spec: 10 },
      8: { norm: 200, spec: 2 },
      9: { norm: 600, spec: 15 },
      10: { norm: 500, spec: 5 }
    };

    const reward = REWARDS[achId];
    if (!reward) return res.status(400).json({ success: false, message: 'Invalid achievement ID' });

    if (!inv.currency) inv.currency = { normal: 0, spec: 0 };
    inv.currency.normal += reward.norm;
    inv.currency.spec += reward.spec;
    inv.achievements.claimedRewards.push(achId);

    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, message: `Reward claimed: +${reward.norm} pebbles, +${reward.spec} special currency!`, currency: inv.currency, claimedRewards: inv.achievements.claimedRewards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;