// ==========================================
// Fájl: Bolt Vezérlő (Shop Controller)
// Cél: A bolt (Tinkerer, Herbalist) napi tárgyainak generálása, lekérése,
// megvásárlása és újragenerálása (reroll).
//
// A tárgyak ára játékos szint szerint skálázódik, és elem-buffokat is kaphatnak.
// ==========================================

// ─── Elemental Buff rendszer ────────────────────────────────────────────────────
// ~15% eséllyel kap egy fegyver elemental buffot (méreg/fagy/vérzés).
// Ha kap, a nyers sebzése 15-30%-kal csökken — nyers sebzés vs. DoT tradeoff.
const ELEMENTAL_BUFFS = [
  { type: 'poison', label: 'Poison', color: '#4ade80', dmgPerTick: 3, ticks: 3, description: 'Deals poison damage over 3 turns' },
  { type: 'cold', label: 'Frost', color: '#60a5fa', dmgPerTick: 2, ticks: 4, description: 'Deals frost damage over 4 turns' },
  { type: 'bleed', label: 'Bleed', color: '#f87171', dmgPerTick: 4, ticks: 2, description: 'Causes bleeding for 2 turns' },
];

/**
 * Elemental buff dobása egy fegyverhez. Null-t vagy egy buff objektumot ad vissza.
 * @param {number} seed - determinisztikus seed (pl. shopRow.id)
 * @param {number} playerLevel - a játékos szintje
 */
function rollElementalBuff(seed, playerLevel) {
  // Determinisztikus pseudo-random a bolt konzisztens megjelenítéséhez
  const roll = Math.abs(Math.sin(seed * 13.37)) % 1;
  if (roll > 0.15) return null; // 85% esély NINCS buff

  const buffIdx = Math.floor(Math.abs(Math.sin(seed * 7.13)) * ELEMENTAL_BUFFS.length) % ELEMENTAL_BUFFS.length;
  const base = ELEMENTAL_BUFFS[buffIdx];

  // DoT sebzés enyhe skálázása szint szerint
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

/**
 * Elemental buff dobása valódi véletlenszerűséggel (küldetés dropokhoz, addItem-hez stb.)
 */
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

const generateShopItemsForDay = async (pool, specieId) => {
  // Ellenőrizzük, hogy van-e már a mai napra generált tárgy
  const [existing] = await pool.execute(
    `SELECT COUNT(*) as count FROM shop WHERE specie_id = ? AND created_date = CURDATE()`,
    [specieId]
  );

  if (existing[0].count > 0) {
    return; // Már vannak generált elemek a mai napra
  }

  // Lekérjük az összes lehetséges tárgyat típusonként (with rarity info for weighting)
  const [weapons] = await pool.execute(`SELECT item_id, rarity FROM item_weapon`);
  const [armors] = await pool.execute(`SELECT item_id, rarity FROM item_armor`);
  const [foods] = await pool.execute(`SELECT item_id, rarity FROM item_food`);
  const [misc] = await pool.execute(`SELECT item_id, rarity FROM item_misc`);

  // Rarity-weighted random pick: common ~60%, rare ~25%, epic ~12%, legendary ~3%
  const getWeightedItem = (arr) => {
    const roll = Math.random();
    let targetRarity;
    if (roll < 0.01) targetRarity = 'legendary';
    else if (roll < 0.04) targetRarity = 'epic';
    else if (roll < 0.35) targetRarity = 'rare';
    else targetRarity = 'common';

    let filtered = arr.filter(x => (x.rarity || 'common').toLowerCase() === targetRarity);
    if (filtered.length === 0 && targetRarity === 'common') {
      filtered = arr.filter(x => (x.rarity || 'common').toLowerCase() === 'rare');
      if (filtered.length === 0) filtered = arr.filter(x => (x.rarity || 'common').toLowerCase() === 'epic');
    }
    const pool_ = filtered.length > 0 ? filtered : arr;
    return pool_[Math.floor(Math.random() * pool_.length)]?.item_id;
  };

  const dungeonScripts = misc.filter(m => (m.name || '').toLowerCase().includes('dungeon'));

  // Tinkerer: 3 fegyver, 2 páncél, 10% esélyen Dungeon Script
  const getTinkererMiscSlot = () => {
    if (dungeonScripts.length > 0 && Math.random() < 0.10) {
      return { type: 'misc', itemId: getWeightedItem(dungeonScripts) };
    }
    return { type: 'armor', itemId: getWeightedItem(armors) };
  };

  const tinkererItems = [
    { type: 'weapon', itemId: getWeightedItem(weapons) },
    { type: 'weapon', itemId: getWeightedItem(weapons) },
    { type: 'weapon', itemId: getWeightedItem(weapons) },
    { type: 'armor', itemId: getWeightedItem(armors) },
    { type: 'armor', itemId: getWeightedItem(armors) },
    getTinkererMiscSlot()
  ];

  // Herbalist: 6 food
  const herbalistItems = [
    { type: 'food', itemId: getWeightedItem(foods) },
    { type: 'food', itemId: getWeightedItem(foods) },
    { type: 'food', itemId: getWeightedItem(foods) },
    { type: 'food', itemId: getWeightedItem(foods) },
    { type: 'food', itemId: getWeightedItem(foods) },
    { type: 'food', itemId: getWeightedItem(foods) }
  ];

  const insertShopItem = async (shopType, item) => {
    if (!item.itemId) return; // Biztonsági check — üres slot kihagyása
    await pool.execute(
      `INSERT INTO shop (specie_id, shop_type, item_type, item_id, created_date, purchased) VALUES (?, ?, ?, ?, CURDATE(), 0)`,
      [specieId, shopType, item.type, item.itemId]
    );
  };

  for (const item of tinkererItems) {
    await insertShopItem('tinkerer', item);
  }
  for (const item of herbalistItems) {
    await insertShopItem('herbalist', item);
  }
};

const getShopItems = async (req, res) => {
  const pool = req.pool;
  const { shopType } = req.params; // 'tinkerer' | 'herbalist'
  const userId = req.user.userId;

  try {
    // Karakter lekérése a user alapján
    const [species] = await pool.execute(`SELECT id, lvl FROM specie WHERE user_id = ? LIMIT 1`, [userId]);
    if (species.length === 0) {
      return res.status(404).json({ success: false, message: 'Character not found' });
    }
    const specie = species[0];
    const specieId = specie.id;
    const playerLevel = specie.lvl;

    // Ha nincs még mai tárgy, generáljuk le
    await generateShopItemsForDay(pool, specieId);

    // Lekérjük az adatokat a shop táblából
    const [shopRows] = await pool.execute(
      `SELECT * FROM shop WHERE specie_id = ? AND shop_type = ? AND created_date = CURDATE()`,
      [specieId, shopType]
    );

    // Bővítjük a sorokat a tárgyak részletes adataival
    const shopList = [];
    for (const row of shopRows) {
      let itemQuery = '';
      if (row.item_type === 'weapon') itemQuery = 'SELECT * FROM item_weapon WHERE item_id = ?';
      if (row.item_type === 'armor') itemQuery = 'SELECT * FROM item_armor WHERE item_id = ?';
      if (row.item_type === 'food') itemQuery = 'SELECT * FROM item_food WHERE item_id = ?';
      if (row.item_type === 'misc') itemQuery = 'SELECT * FROM item_misc WHERE item_id = ?';

      if (itemQuery) {
        const [items] = await pool.execute(itemQuery, [row.item_id]);
        if (items.length > 0) {
          const itemDetails = items[0];

          // Árszámítás logikája — simple linear scaling: +4% per level
          const calculatePrice = (baseCost) => {
            if (!baseCost) return 0;
            return Math.round(baseCost * (1 + playerLevel * 0.04));
          };

          const buyPriceNormal = calculatePrice(itemDetails.normal_currency_cost);
          const buyPriceSpec = calculatePrice(itemDetails.spec_currency_cost || 0);

          let itemWeaponDmg = itemDetails.base_damage;
          let itemArmorPt = itemDetails.armor_point;
          let elementalBuff = null;

          if (row.item_type === 'weapon') {
            // Variáció: -5-től +8-ig eltolás az egyedi érzetért
            const offset = Math.floor((Math.sin(row.id * 3.14) * 0.5 + 0.5) * 14) - 5;
            itemWeaponDmg = itemDetails.base_damage + offset + (playerLevel * 2);

            // Elemental buff dobása (determinisztikus, shop sor id alapján)
            elementalBuff = rollElementalBuff(row.id, playerLevel);
            if (elementalBuff) {
              // Nyers sebzés csökkentése 15-30%-kal buff esetén (trade-off)
              const reduction = 0.15 + (Math.abs(Math.sin(row.id * 2.71)) * 0.15);
              itemWeaponDmg = Math.max(1, Math.floor(itemWeaponDmg * (1 - reduction)));
            }
          } else if (row.item_type === 'armor') {
            // Variáció: -4-től +6-ig eltolás
            const offset = Math.floor((Math.sin(row.id * 2.71) * 0.5 + 0.5) * 11) - 4;
            itemArmorPt = itemDetails.armor_point + offset;
          }

          shopList.push({
            shop_id: row.id,
            purchased: row.purchased,
            item: {
              ...itemDetails,
              id: itemDetails.item_id,
              type: row.item_type,
              weapon_damage: itemWeaponDmg,
              armor_point: itemArmorPt,
              buy_price_normal: buyPriceNormal,
              buy_price_spec: buyPriceSpec,
              ...(elementalBuff ? { elemental_buff: elementalBuff } : {})
            }
          });
        }
      }
    }

    res.json({ success: true, shopItems: shopList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error fetching shop' });
  }
};

const buyShopItem = async (req, res) => {
  const pool = req.pool;
  const { shopId } = req.body;
  const userId = req.user.userId;

  try {
    // 1. Karakter lekérése és validálása
    const [species] = await pool.execute(`SELECT id, lvl, inventory_json FROM specie WHERE user_id = ? LIMIT 1`, [userId]);
    if (species.length === 0) {
      return res.status(404).json({ success: false, message: 'Character not found' });
    }
    const specie = species[0];
    const playerLevel = specie.lvl;
    const inventory = JSON.parse(specie.inventory_json || '{}');
    const defaultAch = { enemiesEnc: [], weaponsEnc: [], armorsEnc: [], foodsEnc: [], maxCrits: 0, flawlessWins: 0, deaths: 0, spentNormal: 0, foundLegendary: false, hoarderAchieved: false };
    inventory.achievements = { ...defaultAch, ...(inventory.achievements || {}) };

    // 2. Bolt tárgy lekérése és validálása
    const [shopRows] = await pool.execute(
      `SELECT * FROM shop WHERE id = ? AND specie_id = ?`,
      [shopId, specie.id]
    );

    if (shopRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shop item not found' });
    }

    const shopItem = shopRows[0];
    if (shopItem.purchased) {
      return res.status(400).json({ success: false, message: 'Item already purchased' });
    }
    if (shopItem.created_date.toISOString().split('T')[0] !== new Date().toISOString().split('T')[0]) {
      // A bolt naponta éjfélkor frissül — ha a created_date eltér a mai naptól, a sor nem érvényes.
    }

    // 3. Tárgy adatok lekérése az árszámításhoz
    let itemQuery = '';
    let categoryTable = '';
    if (shopItem.item_type === 'weapon') { itemQuery = 'SELECT * FROM item_weapon WHERE item_id = ?'; categoryTable = 'weapon'; }
    if (shopItem.item_type === 'armor') { itemQuery = 'SELECT * FROM item_armor WHERE item_id = ?'; categoryTable = 'armor'; }
    if (shopItem.item_type === 'food') { itemQuery = 'SELECT * FROM item_food WHERE item_id = ?'; categoryTable = 'food'; }
    if (shopItem.item_type === 'misc') { itemQuery = 'SELECT * FROM item_misc WHERE item_id = ?'; categoryTable = 'misc'; }

    const [items] = await pool.execute(itemQuery, [shopItem.item_id]);
    if (items.length === 0) {
      return res.status(500).json({ success: false, message: 'Item database error' });
    }
    const itemDetails = items[0];

    // Árszámítás — lineáris: +4% szintenként
    const calculatePrice = (baseCost) => {
      if (!baseCost) return 0;
      return Math.round(baseCost * (1 + playerLevel * 0.04));
    };

    const buyPriceNormal = calculatePrice(itemDetails.normal_currency_cost);
    const buyPriceSpec = calculatePrice(itemDetails.spec_currency_cost || 0);

    // Pénz levonása — mindkét devizából, amennyit az ár meghatároz
    if (!inventory.currency) inventory.currency = { normal: 0, spec: 0 };

    if (inventory.currency.normal < buyPriceNormal || inventory.currency.spec < buyPriceSpec) {
      return res.status(400).json({ success: false, message: 'You do not have enough currency' });
    }

    inventory.currency.normal -= buyPriceNormal;
    inventory.currency.spec -= buyPriceSpec;

    // Inventoryban szabad hely ellenőrzése
    inventory.used = inventory.used || 0;
    inventory.capacity = inventory.capacity || 200;
    const invSize = itemDetails.inventory_size || 10;
    if (inventory.used + invSize > inventory.capacity) {
      return res.status(400).json({ success: false, message: 'Not enough space in inventory' });
    }

    // 4. Új item objektum létrehozása az inventory-ba
    const newItem = {
      ...itemDetails,
      id: Date.now() + Math.floor(Math.random() * 1000), // Egyedi azonosító az inventoryban
      item_id: itemDetails.item_id, // DB hivatkozás
      type: shopItem.item_type,
      quantity: 1
    };

    // Fegyver sebzés inicializálása
    if (shopItem.item_type === 'weapon') {
      const offset = Math.floor((Math.sin(shopItem.id * 3.14) * 0.5 + 0.5) * 14) - 5;
      newItem.weapon_damage = itemDetails.base_damage + offset + (playerLevel * 2);

      // Elemental buff dobása (determinisztikus, shop sor id alapján)
      const elementalBuff = rollElementalBuff(shopItem.id, playerLevel);
      if (elementalBuff) {
        const reduction = 0.15 + (Math.abs(Math.sin(shopItem.id * 2.71)) * 0.15);
        newItem.weapon_damage = Math.max(1, Math.floor(newItem.weapon_damage * (1 - reduction)));
        newItem.elemental_buff = elementalBuff;
      }
    } else if (shopItem.item_type === 'armor') {
      const offset = Math.floor((Math.sin(shopItem.id * 2.71) * 0.5 + 0.5) * 11) - 4;
      newItem.armor_point = itemDetails.armor_point + offset;
    }

    // Étel buff_id hozzáadása az inventory objektumhoz
    if (shopItem.item_type === 'food') {
      newItem.buff_id = itemDetails.buff_id;
    }

    inventory.items.push(newItem);
    inventory.used += invSize;

    // Achievement követése
    inventory.achievements.spentNormal += buyPriceNormal;
    if (inventory.used >= inventory.capacity) inventory.achievements.hoarderAchieved = true;
    if (itemDetails.rarity && itemDetails.rarity.toLowerCase() === 'legendary') inventory.achievements.foundLegendary = true;

    if (shopItem.item_type === 'weapon' && !inventory.achievements.weaponsEnc.includes(itemDetails.item_id)) {
      inventory.achievements.weaponsEnc.push(itemDetails.item_id);
    } else if (shopItem.item_type === 'armor' && !inventory.achievements.armorsEnc.includes(itemDetails.item_id)) {
      inventory.achievements.armorsEnc.push(itemDetails.item_id);
    } else if ((shopItem.item_type === 'food' || shopItem.item_type === 'misc') && !inventory.achievements.foodsEnc.includes(itemDetails.item_id)) {
      inventory.achievements.foodsEnc.push(itemDetails.item_id);
    }

    // 5. Frissítés mentése
    await pool.execute(
      `UPDATE specie SET inventory_json = ? WHERE id = ?`,
      [JSON.stringify(inventory), specie.id]
    );

    // 6. Shop tárgy megjelölése megvásároltnak
    await pool.execute(
      `UPDATE shop SET purchased = 1 WHERE id = ?`,
      [shopId]
    );

    res.json({
      success: true,
      message: 'Successful purchase!',
      currency: inventory.currency
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error during purchase' });
  }
};

const rerollShop = async (req, res) => {
  const pool = req.pool;
  const { shopType } = req.body;
  const userId = req.user.userId;

  try {
    const [species] = await pool.execute(`SELECT id, inventory_json FROM specie WHERE user_id = ? LIMIT 1`, [userId]);
    if (species.length === 0) return res.status(404).json({ success: false, message: 'Character not found' });
    const specie = species[0];
    const inventory = JSON.parse(specie.inventory_json || '{}');
    const rerollCost = 10;
    if (!inventory.currency || inventory.currency.spec < rerollCost) {
      return res.status(400).json({ success: false, message: 'Not enough special currency to reroll (Cost: 10)' });
    }

    inventory.currency.spec -= rerollCost;
    await pool.execute(`UPDATE specie SET inventory_json = ? WHERE id = ?`, [JSON.stringify(inventory), specie.id]);

    await pool.execute(`DELETE FROM shop WHERE specie_id = ? AND shop_type = ? AND created_date = CURDATE()`, [specie.id, shopType]);

    const [weapons] = await pool.execute(`SELECT item_id, rarity FROM item_weapon`);
    const [armors] = await pool.execute(`SELECT item_id, rarity FROM item_armor`);
    const [foods] = await pool.execute(`SELECT item_id, rarity FROM item_food`);
    const [misc] = await pool.execute(`SELECT item_id, rarity FROM item_misc`);
    const getWeightedItem = (arr) => {
      if (!arr.length) return undefined;
      const roll = Math.random();
      let targetRarity;
      if (roll < 0.01) targetRarity = 'legendary';
      else if (roll < 0.04) targetRarity = 'epic';
      else if (roll < 0.35) targetRarity = 'rare';
      else targetRarity = 'common';

      let filtered = arr.filter(x => (x.rarity || 'common').toLowerCase() === targetRarity);
      if (filtered.length === 0 && targetRarity === 'common') {
        filtered = arr.filter(x => (x.rarity || 'common').toLowerCase() === 'rare');
        if (filtered.length === 0) filtered = arr.filter(x => (x.rarity || 'common').toLowerCase() === 'epic');
      }
      const pool_ = filtered.length > 0 ? filtered : arr;
      return pool_[Math.floor(Math.random() * pool_.length)]?.item_id;
    };

    const insertShopItem = async (type, itemId) => {
      if (!itemId) return;
      await pool.execute(
        `INSERT INTO shop (specie_id, shop_type, item_type, item_id, created_date, purchased) VALUES (?, ?, ?, ?, CURDATE(), 0)`,
        [specie.id, shopType, type, itemId]
      );
    };

    const dungeonScripts = misc.filter(m => (m.name || '').toLowerCase().includes('dungeon'));

    if (shopType === 'tinkerer') {
      await insertShopItem('weapon', getWeightedItem(weapons));
      await insertShopItem('weapon', getWeightedItem(weapons));
      await insertShopItem('weapon', getWeightedItem(weapons));
      await insertShopItem('armor', getWeightedItem(armors));
      await insertShopItem('armor', getWeightedItem(armors));

      if (dungeonScripts.length > 0 && Math.random() < 0.10) {
        await insertShopItem('misc', getWeightedItem(dungeonScripts));
      } else {
        await insertShopItem('armor', getWeightedItem(armors));
      }
    } else if (shopType === 'herbalist') {
      for (let i = 0; i < 6; i++) {
        await insertShopItem('food', getWeightedItem(foods));
      }
    }

    res.json({ success: true, message: 'Shop rerolled successfully!', currency: inventory.currency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error rerolling shop' });
  }
};

module.exports = {
  generateShopItemsForDay,
  getShopItems,
  buyShopItem,
  rerollShop
};
