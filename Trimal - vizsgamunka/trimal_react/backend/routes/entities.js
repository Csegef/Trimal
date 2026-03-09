// backend/routes/entities.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET /api/entities - Fetch all entities for the Cave Station "book"
router.get('/', async (req, res) => {
  const pool = req.pool;
  try {
    const [enemies] = await pool.execute('SELECT * FROM enemy ORDER BY category DESC');
    const [weapons] = await pool.execute('SELECT * FROM item_weapon ORDER BY rarity DESC');
    const [armors] = await pool.execute('SELECT * FROM item_armor ORDER BY rarity DESC');
    const [foods] = await pool.execute('SELECT * FROM item_food ORDER BY rarity DESC');

    res.json({
      success: true,
      data: {
        enemies,
        weapons,
        armors,
        foods
      }
    });
  } catch (err) {
    console.error('[Entities] GET / error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
