// src/api/inventoryApi.js
// A frontend (Inventory.jsx) ezt a service-t használja.
// JWT tokent küld az Express backendnek, ami továbbítja a PHP-nak.

const BASE_URL = '/api/inventory';

// ─── Auth helper ─────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('token');
}

// ─── Alap fetch wrapper ───────────────────────────────────────────────────────

async function request(path, method = 'GET', body = null) {
  const token = getToken();

  if (!token) {
    throw new AuthError('Nincs bejelentkezve');
  }

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  // Token lejárt vagy érvénytelen
  if (response.status === 401) {
    localStorage.removeItem('token');
    throw new AuthError('Munkamenet lejárt, kérlek lépj be újra');
  }

  const data = await response.json();

  if (!response.ok && !data.success) {
    throw new Error(data.message || `HTTP hiba: ${response.status}`);
  }

  return data;
}

// ─── AuthError osztály ────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

// ─── GET műveletek ────────────────────────────────────────────────────────────

/**
 * Teljes inventory lekérése
 * @returns {Promise<{capacity, used, currency, items, equipped}>}
 */
export async function getInventory() {
  const res = await request('/');
  if (!res.success) throw new Error(res.message);
  return res.data;
}

/**
 * Játékos adatok lekérése (szint, xp, statok, karakter kinézet)
 * @returns {Promise<{id, name, lvl, xp, xpForNext, class, hairStyle, beardStyle, stats}>}
 */
export async function getPlayerInfo() {
  const res = await request('/player');
  if (!res.success) throw new Error(res.message);
  return res.data;
}

// ─── Tárgy műveletek ─────────────────────────────────────────────────────────

/**
 * Tárgyat ad az inventory-hoz (quest jutalom, loot)
 * @param {string} itemType - "weapon" | "armor" | "food" | "misc"
 * @param {number} itemId
 * @param {number} quantity
 */
export async function addItem(itemType, itemId, quantity = 1) {
  const res = await request('/addItem', 'POST', { itemType, itemId, quantity });
  if (!res.success) throw new Error(res.message);
  return res;
}

/**
 * Tárgyat távolít el az inventory-ból
 */
export async function removeItem(itemType, itemId, quantity = 1) {
  const res = await request('/removeItem', 'POST', { itemType, itemId, quantity });
  if (!res.success) throw new Error(res.message);
  return res;
}

/**
 * Tárgy eladása – eltávolítja és pénzt ad
 * Felszerelt tárgyat nem lehet eladni
 */
export async function sellItem(itemType, itemId, quantity = 1) {
  const res = await request('/sell', 'POST', { itemType, itemId, quantity });
  if (!res.success) throw new Error(res.message);
  return res;
}

// ─── Felszerelés ─────────────────────────────────────────────────────────────

/**
 * Felszerel egy tárgyat
 * @param {string} slot - "weapon" | "armor_head" | "armor_chest" | "armor_legs" | "armor_feet"
 * @param {number} itemId
 */
export async function equipItem(slot, itemId) {
  const res = await request('/equip', 'POST', { slot, itemId });
  if (!res.success) throw new Error(res.message);
  return res;
}

/**
 * Levesz egy felszerelt tárgyat
 * @param {string} slot
 */
export async function unequipItem(slot) {
  const res = await request('/unequip', 'POST', { slot });
  if (!res.success) throw new Error(res.message);
  return res;
}

/**
 * Meghatározza a felszerelési slotot a tárgy típusa és kategóriája alapján
 * @param {object} item
 * @returns {string|null}
 */
export function resolveEquipSlot(item) {
  if (item.type === 'weapon') return 'weapon';
  if (item.type === 'armor') {
    const cat = (item.category || '').toLowerCase();
    if (cat.includes('head') || cat.includes('sisak') || cat.includes('helm'))   return 'armor_head';
    if (cat.includes('chest') || cat.includes('mellvért') || cat.includes('body')) return 'armor_chest';
    if (cat.includes('leg') || cat.includes('nadrág') || cat.includes('pants'))  return 'armor_legs';
    if (cat.includes('feet') || cat.includes('cipő') || cat.includes('boot'))   return 'armor_feet';
  }
  return null;
}

// ─── Valuta ───────────────────────────────────────────────────────────────────

export async function addCurrency(normal = 0, spec = 0) {
  const res = await request('/currency/add', 'POST', { normal, spec });
  if (!res.success) throw new Error(res.message);
  return res;
}

export async function removeCurrency(normal = 0, spec = 0) {
  const res = await request('/currency/remove', 'POST', { normal, spec });
  if (!res.success) throw new Error(res.message);
  return res;
}

// ─── Quest ────────────────────────────────────────────────────────────────────

export async function completeQuest(questId) {
  const res = await request('/quest/complete', 'POST', { questId });
  if (!res.success) throw new Error(res.message);
  return res;
}

// ─── Kombinált betöltés ───────────────────────────────────────────────────────

/**
 * Inventory oldal betöltésekor egyszerre kéri le az inventory-t és player infót
 */
export async function loadInventoryPage() {
  const [inventory, playerInfo] = await Promise.all([
    getInventory(),
    getPlayerInfo(),
  ]);
  return { inventory, playerInfo };
}
