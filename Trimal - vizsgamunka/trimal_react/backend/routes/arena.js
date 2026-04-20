const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getLeaderboard, startArenaFight, claimArenaVictory } = require('../controllers/arenaController');

router.use(authMiddleware);

router.get('/leaderboard', getLeaderboard);
router.post('/fight', startArenaFight);
router.post('/claim', claimArenaVictory);

module.exports = router;
