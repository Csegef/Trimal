const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

const Character = require('../models/Character');

// GET karakterek egy felhasználóhoz
router.get('/:userId', authenticateToken, async (req, res) => {
  if (parseInt(req.params.userId) !== req.user.userId) {
    return res.status(403).json({ success: false, message: 'Hozzáférés megtagadva' });
  }

  const pool = req.pool;
  const charModel = new Character(pool);
  try {
    const chars = await charModel.findByUserId(req.params.userId);
    res.json({ success: true, characters: chars });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hiba a karakterek lekérdezésekor' });
  }
});

// PUT karakter frissítés
router.put('/:charId', authenticateToken, async (req, res) => {
  const pool = req.pool;
  const { lvl, xp, hair_style, beard_style, stamina, userId } = req.body;

  if (parseInt(userId) !== req.user.userId) {
    return res.status(403).json({ success: false, message: 'Hozzáférés megtagadva' });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE specie SET lvl = ?, xp = ?, hair_style = ?, beard_style = ?, stamina = ?, updated_at = NOW() WHERE id = ?`,
      [lvl, xp, hair_style, beard_style, stamina, req.params.charId]
    );
    res.json({ success: true, message: 'Karakter frissítve' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hiba a karakter frissítésekor' });
  }
});

module.exports = router;