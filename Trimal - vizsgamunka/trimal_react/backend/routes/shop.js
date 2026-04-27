// ==========================================
// Fájl: Bolt Útvonalak (Shop Routes)
// Cél: A kereskedő állomásokkal (Herbalist, Tinkerer) kapcsolatos műveletek.
//
// Ide érkeznek a vásárlási és frissítési (reroll) kérelmek.
// ==========================================
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const { getShopItems, buyShopItem, rerollShop } = require('../controllers/shopController');

router.use(authenticateToken);

// GET /api/shop/tinkerer vagy /api/shop/herbalist
router.get('/:shopType', getShopItems);

// POST /api/shop/buy
router.post('/buy', buyShopItem);

// POST /api/shop/reroll
router.post('/reroll', rerollShop);

module.exports = router;