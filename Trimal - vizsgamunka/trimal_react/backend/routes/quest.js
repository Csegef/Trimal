const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

// GET questek egy karakterhez
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
      `SELECT * FROM quest WHERE specie_id = ?`,
      [req.params.specieId]
    );

    res.json({ success: true, quests: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hiba a questek lekérdezésekor' });
  }
});

// PUT quest frissítés
router.put('/:questId', authenticateToken, async (req, res) => {
  const pool = req.pool;
  const userId = req.user.userId;
  const { currency, spec_currency, xp } = req.body;

  try {
    const [[quest]] = await pool.execute(
      `SELECT s.user_id FROM quest q JOIN specie s ON q.specie_id = s.id WHERE q.quest_id = ?`,
      [req.params.questId]
    );
    if (!quest || quest.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Hozzáférés megtagadva' });
    }

    await pool.execute(
      `UPDATE quest SET currency=?, spec_currency=?, xp=? WHERE quest_id=?`,
      [currency, spec_currency, xp, req.params.questId]
    );

    res.json({ success: true, message: 'Quest frissítve' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hiba a quest frissítésekor' });
  }
});

module.exports = router;