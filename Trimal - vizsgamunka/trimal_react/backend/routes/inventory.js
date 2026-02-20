// backend/routes/inventory.js
const express = require('express');
const router = express.Router();
const http = require('http');
const authMiddleware = require('../middleware/authMiddleware');

// ─── PHP hívás helper ────────────────────────────────────────────────────────
// Az Express backend HTTP-n hívja a XAMPP-on futó PHP inventory_api.php-t.
// A PHP-k helye: C:/xampp/htdocs/trimal/api/
// XAMPP alapból: http://localhost/trimal/api/inventory_api.php

const PHP_BASE = process.env.PHP_BASE_URL || 'http://localhost/trimal/api/inventory_api.php';

/**
 * HTTP kérést küld a PHP API-nak
 * @param {string} action - GET action
 * @param {string} method - HTTP method
 * @param {object|null} body - POST body
 * @param {number} playerId - játékos ID (specie ID)
 * @returns {Promise<object>} - PHP JSON válasz
 */
function callPhp(action, method = 'GET', body = null, playerId) {
  return new Promise((resolve, reject) => {
    const url = new URL(PHP_BASE);
    url.searchParams.set('action', action);
    url.searchParams.set('player_id', playerId); // PHP oldalon ezt olvassuk session helyett

    const postData = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': process.env.PHP_INTERNAL_KEY || 'trimal_internal_2024',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('PHP válasz nem JSON: ' + data.substring(0, 200)));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error('PHP kapcsolat hiba: ' + err.message));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

// ─── Middleware: minden route JWT-vel védett ─────────────────────────────────
router.use(authMiddleware);

// ─── GET /api/inventory ─ teljes inventory lekérése ──────────────────────────
router.get('/', async (req, res) => {
  try {
    const playerId = req.user.specieId; // authMiddleware tölti fel
    const data = await callPhp('get', 'GET', null, playerId);
    res.json(data);
  } catch (err) {
    console.error('[Inventory] GET error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/inventory/player ─ játékos adatok (szint, statok, karakter) ───
router.get('/player', async (req, res) => {
  try {
    const playerId = req.user.specieId;
    const data = await callPhp('getPlayerInfo', 'GET', null, playerId);
    res.json(data);
  } catch (err) {
    console.error('[Inventory] GET /player error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/equip ───────────────────────────────────────────────
router.post('/equip', async (req, res) => {
  try {
    const { slot, itemId } = req.body;
    if (!slot || !itemId) {
      return res.status(400).json({ success: false, message: 'Hiányzó: slot, itemId' });
    }
    const playerId = req.user.specieId;
    const data = await callPhp('equip', 'POST', { slot, itemId }, playerId);
    res.json(data);
  } catch (err) {
    console.error('[Inventory] POST /equip error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/unequip ────────────────────────────────────────────
router.post('/unequip', async (req, res) => {
  try {
    const { slot } = req.body;
    if (!slot) {
      return res.status(400).json({ success: false, message: 'Hiányzó: slot' });
    }
    const playerId = req.user.specieId;
    const data = await callPhp('unequip', 'POST', { slot }, playerId);
    res.json(data);
  } catch (err) {
    console.error('[Inventory] POST /unequip error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/sell ────────────────────────────────────────────────
router.post('/sell', async (req, res) => {
  try {
    const { itemType, itemId, quantity = 1 } = req.body;
    if (!itemType || !itemId) {
      return res.status(400).json({ success: false, message: 'Hiányzó: itemType, itemId' });
    }
    const playerId = req.user.specieId;
    const data = await callPhp('sellItem', 'POST', { itemType, itemId, quantity }, playerId);
    res.json(data);
  } catch (err) {
    console.error('[Inventory] POST /sell error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/addItem ─────────────────────────────────────────────
// Belső használatra (quest jutalom, loot) – frontendről általában nem hívják
router.post('/addItem', async (req, res) => {
  try {
    const { itemType, itemId, quantity = 1 } = req.body;
    if (!itemType || !itemId) {
      return res.status(400).json({ success: false, message: 'Hiányzó: itemType, itemId' });
    }
    const playerId = req.user.specieId;
    const data = await callPhp('addItem', 'POST', { itemType, itemId, quantity }, playerId);
    res.json(data);
  } catch (err) {
    console.error('[Inventory] POST /addItem error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/removeItem ─────────────────────────────────────────
router.post('/removeItem', async (req, res) => {
  try {
    const { itemType, itemId, quantity = 1 } = req.body;
    if (!itemType || !itemId) {
      return res.status(400).json({ success: false, message: 'Hiányzó: itemType, itemId' });
    }
    const playerId = req.user.specieId;
    const data = await callPhp('removeItem', 'POST', { itemType, itemId, quantity }, playerId);
    res.json(data);
  } catch (err) {
    console.error('[Inventory] POST /removeItem error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/currency/add ────────────────────────────────────────
router.post('/currency/add', async (req, res) => {
  try {
    const { normal = 0, spec = 0 } = req.body;
    const playerId = req.user.specieId;
    const data = await callPhp('addCurrency', 'POST', { normal, spec }, playerId);
    res.json(data);
  } catch (err) {
    console.error('[Inventory] POST /currency/add error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/currency/remove ─────────────────────────────────────
router.post('/currency/remove', async (req, res) => {
  try {
    const { normal = 0, spec = 0 } = req.body;
    const playerId = req.user.specieId;
    const data = await callPhp('removeCurrency', 'POST', { normal, spec }, playerId);
    res.json(data);
  } catch (err) {
    console.error('[Inventory] POST /currency/remove error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/inventory/quest/complete ──────────────────────────────────────
router.post('/quest/complete', async (req, res) => {
  try {
    const { questId } = req.body;
    if (!questId) {
      return res.status(400).json({ success: false, message: 'Hiányzó: questId' });
    }
    const playerId = req.user.specieId;
    const data = await callPhp('completeQuest', 'POST', { questId }, playerId);
    res.json(data);
  } catch (err) {
    console.error('[Inventory] POST /quest/complete error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;