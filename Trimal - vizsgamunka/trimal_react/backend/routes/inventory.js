const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

// GET inventory egy karakterhez
router.get('/:specieId', authenticateToken, async (req, res) => {
  const pool = req.pool;
  const userId = req.user.userId;

  try {
    // Ellenőrizni kell, hogy a specieId tényleg a felhasználóhoz tartozik
    const [[specie]] = await pool.execute(
      `SELECT user_id FROM specie WHERE id = ?`,
      [req.params.specieId]
    );

    if (!specie || specie.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Hozzáférés megtagadva' });
    }

    const [rows] = await pool.execute(
      `SELECT * FROM inventory WHERE specie_id = ?`,
      [req.params.specieId]
    );

    res.json({ success: true, inventory: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hiba az inventory lekérdezésekor' });
  }
});

// POST új tétel hozzáadása
router.post('/', authenticateToken, async (req, res) => {
  const pool = req.pool;
  const userId = req.user.userId;
  const { specie_id, armor_id, weapon_id, misc_id, food_id, item_quantity } = req.body;

  try {
    const [[specie]] = await pool.execute(
      `SELECT user_id FROM specie WHERE id = ?`,
      [specie_id]
    );
    if (!specie || specie.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Hozzáférés megtagadva' });
    }

    await pool.execute(
      `INSERT INTO inventory (specie_id, armor_id, weapon_id, misc_id, food_id, item_quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [specie_id, armor_id, weapon_id, misc_id, food_id, item_quantity]
    );

    res.json({ success: true, message: 'Tétel hozzáadva az inventoryhoz' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hiba a tétel hozzáadásakor' });
  }
});

// PUT inventory tétel frissítése
router.put('/:specieId', authenticateToken, async (req, res) => {
  const pool = req.pool;
  const userId = req.user.userId;
  const { armor_id, weapon_id, misc_id, food_id, item_quantity } = req.body;

  try {
    const [[specie]] = await pool.execute(
      `SELECT user_id FROM specie WHERE id = ?`,
      [req.params.specieId]
    );
    if (!specie || specie.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Hozzáférés megtagadva' });
    }

    await pool.execute(
      `UPDATE inventory SET armor_id=?, weapon_id=?, misc_id=?, food_id=?, item_quantity=? WHERE specie_id=?`,
      [armor_id, weapon_id, misc_id, food_id, item_quantity, req.params.specieId]
    );

    res.json({ success: true, message: 'Inventory frissítve' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hiba az inventory frissítésekor' });
  }
});

module.exports = router;