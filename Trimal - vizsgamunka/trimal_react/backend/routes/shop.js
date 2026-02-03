const express = require('express');
const router = express.Router();

// GET shop items egy karakterhez
router.get('/:specieId', async (req, res) => {
  const pool = req.pool;
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM shop WHERE specie_id = ?`,
      [req.params.specieId]
    );
    res.json({ success: true, shop: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hiba a shop lekérdezésekor' });
  }
});

module.exports = router;