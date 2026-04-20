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
      } catch(e) {}
      
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
        hairStyle: typeof row.hair_style === 'string' ? parseInt(row.hair_style.split('-').pop()) || 0 : row.hair_style || 0,
        beardStyle: typeof row.beard_style === 'string' ? parseInt(row.beard_style.split('-').pop()) || 0 : row.beard_style || 0,
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
    } catch(e) {}
    
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
        hairStyle: typeof targetRow.hair_style === 'string' ? parseInt(targetRow.hair_style.split('-').pop()) || 0 : targetRow.hair_style || 0,
        beardStyle: typeof targetRow.beard_style === 'string' ? parseInt(targetRow.beard_style.split('-').pop()) || 0 : targetRow.beard_style || 0,
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
    const { isWin } = req.body;
    const pool = req.pool;
    
    const inv = await loadInventory(pool, req.user.specieId);
    if (!inv || !inv.active_quest || !inv.active_quest.isArena) {
      return res.status(400).json({ success: false, message: 'No active arena fight' });
    }

    const targetSpecieId = inv.active_quest.targetSpecieId;
    inv.active_quest = null; // clear it immediately

    let stolenItem = null;

    if (isWin) {
      // 40% chance to steal an item
      if (Math.random() < 0.40) {
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
