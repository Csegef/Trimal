// backend/routes/inventory.js
// Direct MySQL implementation – no PHP proxy needed.
// Inventory is stored as JSON in specie.inventory_json

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Load inventory JSON for a given specie (character) id */
async function loadInventory(pool, specieId) {
  const [rows] = await pool.execute(
    'SELECT inventory_json FROM specie WHERE id = ?',
    [specieId]
  );
  if (!rows[0]) return null;

  const raw = rows[0].inventory_json;
  if (raw) {
    try { return JSON.parse(raw); } catch { }
  }

  // Default structure
  return {
    capacity: 100,
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
  };
}

/** Persist inventory JSON back to the database */
async function saveInventory(pool, specieId, inventory) {
  await pool.execute(
    'UPDATE specie SET inventory_json = ? WHERE id = ?',
    [JSON.stringify(inventory), specieId]
  );
}

/** Recalculate the `used` field (1 slot per unique stack) */
function recalcUsed(inventory) {
  inventory.used = inventory.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
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
        stats: { strength: 5, agility: 5, intelligence: 5, endurance: 5 },
      },
    });
  } catch (err) {
    console.error('[Inventory] GET /player error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/equip ────────────────────────────────────────────────
router.post('/equip', async (req, res) => {
  try {
    const { slot, itemId } = req.body;
    if (!slot || itemId == null)
      return res.status(400).json({ success: false, message: 'Missing: slot, itemId' });

    const validSlots = ['weapon', 'armor_cap', 'armor_plate', 'armor_leggings', 'armor_boots'];
    if (!validSlots.includes(slot))
      return res.status(400).json({ success: false, message: 'Invalid equipment slot: ' + slot });

    const inv = await loadInventory(req.pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });

    // Find item in inventory
    const itemIdx = inv.items.findIndex(i => i.id == itemId);
    if (itemIdx === -1) return res.status(400).json({ success: false, message: 'Item not found in inventory' });
    const item = inv.items[itemIdx];

    if (slot === 'weapon' && item.type !== 'weapon')
      return res.status(400).json({ success: false, message: 'Item is not a weapon' });
    if (slot.startsWith('armor_') && item.type !== 'armor')
      return res.status(400).json({ success: false, message: 'Item is not armor' });

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

    const idx = inv.items.findIndex(i => i.id == itemId && i.type === itemType);
    if (idx === -1)
      return res.status(400).json({ success: false, message: 'Item not found' });

    const item = inv.items[idx];
    // Check if item is equipped (now stored as objects)
    const isEquipped = Object.values(inv.equipped || {}).some(
      e => e && typeof e === 'object' && e.id == item.id
    );
    if (isEquipped)
      return res.status(400).json({ success: false, message: 'Cannot sell an equipped item' });

    const sellQty = Math.min(quantity, item.quantity);
    const sellPrice = (item.sell_price || 0) * sellQty;

    item.quantity -= sellQty;
    if (item.quantity <= 0) inv.items.splice(idx, 1);

    inv.currency.normal = (inv.currency.normal || 0) + sellPrice;
    recalcUsed(inv);

    await saveInventory(req.pool, req.user.specieId, inv);
    res.json({ success: true, message: `Sold for ${sellPrice} gold` });
  } catch (err) {
    console.error('[Inventory] POST /sell error:', err.message);
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

    const existing = inv.items.find(i => i.id == itemId && i.type === itemType);
    if (existing) {
      existing.quantity += quantity;
    } else {
      inv.items.push({
        id: itemId,
        type: itemType,
        name: itemData?.name || 'Unknown Item',
        rarity: itemData?.rarity || 'common',
        quantity,
        description: itemData?.description || '',
        sell_price: itemData?.sell_price || 0,
        iconPath: itemData?.iconPath || null,
        ...(itemType === 'weapon' && { base_damage: itemData?.base_damage || 0 }),
        ...(itemType === 'armor' && { armor_point: itemData?.armor_point || 0, category: itemData?.category || 'Armor' }),
        ...(itemType === 'food' && { category: itemData?.category || '', buff_id: itemData?.buff_id || null }),
      });
    }

    recalcUsed(inv);
    if (inv.used > inv.capacity)
      return res.status(400).json({ success: false, message: 'Inventory full' });

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

    // Add XP directly to specie row
    const xpToAdd = quest.xp || 0;
    if (xpToAdd > 0) {
      const [specRows] = await pool.execute(
        'SELECT lvl, xp FROM specie WHERE id = ?',
        [req.user.specieId]
      );
      if (specRows[0]) {
        let { lvl, xp } = specRows[0];
        xp += xpToAdd;
        while (xp >= lvl * 100) { xp -= lvl * 100; lvl++; }
        await pool.execute(
          'UPDATE specie SET xp = ?, lvl = ? WHERE id = ?',
          [xp, lvl, req.user.specieId]
        );
      }
    }

    res.json({ success: true, message: 'Quest completed!' });
  } catch (err) {
    console.error('[Inventory] POST /quest/complete error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;