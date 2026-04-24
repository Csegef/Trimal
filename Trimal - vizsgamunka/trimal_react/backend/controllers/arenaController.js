// backend/controllers/arenaController.js

/** Load inventory JSON for a given specie (character) id */
async function loadInventory(pool, specieId) {
  const [rows] = await pool.execute('SELECT inventory_json FROM specie WHERE id = ?', [specieId]);
  if (!rows[0]) return null;
  const raw = rows[0].inventory_json;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

async function saveInventory(pool, specieId, inventory) {
  await pool.execute(
    'UPDATE specie SET inventory_json = ? WHERE id = ?',
    [JSON.stringify(inventory), specieId]
  );
}

const getLeaderboard = async (req, res) => {
  const pool = req.pool;
  try {
    const [rows] = await pool.execute(`
      SELECT 
        s.id as specie_id, u.id as user_id, u.nickname, s.specie_name as class, 
        s.hair_style, s.beard_style, s.lvl, s.xp, 
        s.base_health, s.base_strength, s.base_agility, s.base_luck, s.base_resistance, s.base_armor,
        s.inventory_json
      FROM specie s 
      JOIN user u ON u.specie_id = s.id 
      WHERE u.is_verified = 1 
      ORDER BY s.lvl DESC, s.xp DESC 
      LIMIT 100
    `);

    const leaderboard = rows.map(row => {
      let inventory = {};
      try {
        inventory = JSON.parse(row.inventory_json || '{}');
      } catch (e) { }

      let armor = row.base_armor || 0;
      let weaponDamage = 10;

      if (inventory.equipped) {
        Object.values(inventory.equipped).forEach(item => {
          if (item) {
            if (item.armor_point) armor += item.armor_point;
            if (item.type === 'weapon' && (item.weapon_damage || item.base_damage)) {
              weaponDamage = item.weapon_damage || item.base_damage;
            }
          }
        });
      }

      return {
        userId: row.user_id,
        specieId: row.specie_id,
        name: row.nickname,
        class: row.class || 'Neanderthal',
        lvl: row.lvl || 1,
        hairStyle: row.hair_style,
        beardStyle: row.beard_style,
        stats: {
          strength: row.base_strength || 10,
          agility: row.base_agility || 10,
          luck: row.base_luck || 10,
          resistance: row.base_resistance || 10,
          health: row.base_health || 10,
          armor: armor
        },
        equipped: inventory.equipped || {},
        weaponDamage
      };
    });

    res.json({ success: true, data: leaderboard });
  } catch (err) {
    console.error('[Arena] GET /leaderboard error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const startArenaFight = async (req, res) => {
  try {
    const { targetSpecieId } = req.body;
    if (!targetSpecieId) return res.status(400).json({ success: false, message: 'Missing target' });

    // Do not fight yourself
    if (targetSpecieId === req.user.specieId) {
      return res.status(400).json({ success: false, message: 'You cannot fight yourself!' });
    }

    const pool = req.pool;

    // Load caller inventory
    const inv = await loadInventory(pool, req.user.specieId);
    if (!inv) return res.status(404).json({ success: false, message: 'Inventory not found' });
    if (inv.active_quest !== null) return res.status(400).json({ success: false, message: 'You are already in a quest or combat' });

    // Cooldown check: 12 hours (43200 seconds) after a successful victory
    const now = Math.floor(Date.now() / 1000);
    const lastPvp = inv.last_pvp_at || 0;
    const cooldownSeconds = 12 * 60 * 60; // 43200
    if (now - lastPvp < cooldownSeconds) {
      const remainingSec = cooldownSeconds - (now - lastPvp);
      const hours = Math.floor(remainingSec / 3600);
      const minutes = Math.ceil((remainingSec % 3600) / 60);
      const timeStr = hours > 0 ? `${hours} hours and ${minutes} minutes` : `${minutes} minutes`;
      return res.status(400).json({ success: false, message: `Arena is on cooldown! You can fight again in ${timeStr}.` });
    }

    // Load target stats
    const [rows] = await pool.execute(`
      SELECT 
        s.id as specie_id, u.nickname, s.specie_name as class, 
        s.hair_style, s.beard_style, s.lvl,
        s.base_health, s.base_strength, s.base_agility, s.base_luck, s.base_resistance, s.base_armor,
        s.inventory_json
      FROM specie s 
      JOIN user u ON u.specie_id = s.id 
      WHERE s.id = ?
    `, [targetSpecieId]);

    const targetRow = rows[0];
    if (!targetRow) return res.status(404).json({ success: false, message: 'Target not found' });

    let targetInventory = {};
    try {
      targetInventory = JSON.parse(targetRow.inventory_json || '{}');
    } catch (e) { }

    let armor = targetRow.base_armor || 0;
    let weaponDamage = 10;

    if (targetInventory.equipped) {
      Object.values(targetInventory.equipped).forEach(item => {
        if (item) {
          if (item.armor_point) armor += item.armor_point;
          if (item.type === 'weapon' && (item.weapon_damage || item.base_damage)) {
            weaponDamage = item.weapon_damage || item.base_damage;
          }
        }
      });
    }

    // Set active quest as arena match
    const maxHp = (targetRow.base_health || 10) * 25 + (targetRow.lvl || 1) * 50;

    inv.active_quest = {
      isArena: true,
      targetSpecieId: targetSpecieId,
      name: 'Arena Fight',
      background: '/src/assets/design/backgrounds/station_background/trimal_arena_background.png',
      enemyObj: {
        name: targetRow.nickname,
        class: targetRow.class || 'Neanderthal',
        hairStyle: targetRow.hair_style || 0,
        beardStyle: targetRow.beard_style || 0,
        lvl: targetRow.lvl || 1,
        stats: {
          strength: targetRow.base_strength || 10,
          agility: targetRow.base_agility || 10,
          luck: targetRow.base_luck || 10,
          resistance: targetRow.base_resistance || 10,
          armor: armor
        },
        maxHp: maxHp,
        hp: maxHp,
        weaponDamage,
        isArenaHuman: true,
        category: 'Medium',
        type: 'none'
      }
    };

    await saveInventory(pool, req.user.specieId, inv);
    res.json({ success: true, message: 'Arena fight started' });

  } catch (err) {
    console.error('[Arena] POST /fight error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const claimArenaVictory = async (req, res) => {
  try {
    const { isWin, achievementsData } = req.body;
    const pool = req.pool;

    const inv = await loadInventory(pool, req.user.specieId);
    if (!inv || !inv.active_quest || !inv.active_quest.isArena) {
      return res.status(400).json({ success: false, message: 'No active arena fight' });
    }

    const targetSpecieId = inv.active_quest.targetSpecieId;
    inv.active_quest = null; // clear it immediately

    // Track achievements
    const achData = achievementsData || {};
    if (achData.maxCrits > inv.achievements.maxCrits) inv.achievements.maxCrits = achData.maxCrits;
    if (isWin) {
      if (achData.flawlessWin) inv.achievements.flawlessWins += 1;
    } else {
      inv.achievements.deaths += 1;
    }

    let stolenItem = null;

    if (isWin) {
      // Set cooldown timestamp
      inv.last_pvp_at = Math.floor(Date.now() / 1000);

      // 15% chance to steal an item (reduced from 40%)
      if (Math.random() < 0.15) {
        const targetInv = await loadInventory(pool, targetSpecieId);
        if (targetInv && targetInv.items && targetInv.items.length > 0) {
          // Weight logic: 1% Legendary, 4% Epic, 25% Rare, 70% Common
          const roll = Math.random();
          let targetRarity = 'common';
          if (roll < 0.01) targetRarity = 'legendary';
          else if (roll < 0.05) targetRarity = 'epic';
          else if (roll < 0.30) targetRarity = 'rare';

          // Group target items by rarity
          const itemsByRarity = {
            legendary: [], epic: [], rare: [], common: []
          };

          targetInv.items.forEach(i => {
            const r = (i.rarity || 'common').toLowerCase();
            if (itemsByRarity[r]) itemsByRarity[r].push(i);
            else itemsByRarity['common'].push(i); // fallback
          });

          // Try to get targeted rarity, fallback to lower, then any available
          let poolToPick = itemsByRarity[targetRarity];
          if (poolToPick.length === 0) {
            const fallbacks = ['common', 'rare', 'epic', 'legendary'];
            for (const fb of fallbacks) {
              if (itemsByRarity[fb].length > 0) {
                poolToPick = itemsByRarity[fb];
                break;
              }
            }
          }

          if (poolToPick.length > 0) {
            const pickedItem = poolToPick[Math.floor(Math.random() * poolToPick.length)];
            const idxTarget = targetInv.items.findIndex(i => i.id === pickedItem.id && i.type === pickedItem.type);

            if (idxTarget !== -1) {
              // Steal it
              stolenItem = { ...targetInv.items[idxTarget], quantity: 1 };

              // Remove from target
              targetInv.items[idxTarget].quantity -= 1;
              if (targetInv.items[idxTarget].quantity <= 0) {
                targetInv.items.splice(idxTarget, 1);
              }
              // recalc target space
              targetInv.used = targetInv.items.reduce((sum, item) => sum + (item.inventory_size || 10), 0);
              await saveInventory(pool, targetSpecieId, targetInv);

              // Add to winner
              const existing = inv.items.find(i => i.id === stolenItem.id && i.type === stolenItem.type);
              if (existing) {
                existing.quantity += 1;
              } else {
                inv.items.push(stolenItem);
              }
              // recalc winner space
              inv.used = inv.items.reduce((sum, item) => sum + (item.inventory_size || 10), 0);
            }
          }
        }
      }
    }

    await saveInventory(pool, req.user.specieId, inv);
    res.json({ success: true, message: 'Arena resolved', stolenItem });

  } catch (err) {
    console.error('[Arena] POST /claim error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getLeaderboard,
  startArenaFight,
  claimArenaVictory
};
