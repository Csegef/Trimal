const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

// GET active_effects egy karakterhez
router.get('/:specieId', authenticateToken, async (req, res) => {
  const pool = req.pool;
  const userId = req.user.userId;

  try {
    const [[specie]] = await pool.execute(
      `SELECT user_id FROM specie WHERE id = ?`,
      [req.params.specieId]
    );
    if (!specie || specie.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Hozzáférés megtagadva' });
    }

    const [rows] = await pool.execute(
      `SELECT ae.*, eb.name AS buff_name, ed.name AS debuff_name
       FROM active_effect ae
       LEFT JOIN effect_buff eb ON ae.buff_id = eb.effect_id
       LEFT JOIN effect_debuff ed ON ae.debuff_id = ed.effect_id
       WHERE ae.specie_id = ?`,
      [req.params.specieId]
    );

    res.json({ success: true, effects: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hiba az effectek lekérdezésekor' });
  }
});

module.exports = router;