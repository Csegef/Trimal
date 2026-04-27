// ==========================================
// Fájl: Aréna Útvonalak (Arena Routes)
// Cél: Az arénával kapcsolatos API végpontok (harc indítása, ranglista).
//
// Ezeket a végpontokat hívja meg a frontend, amikor a játékos meg akar
// támadni egy másikat, vagy be akarja tölteni a toplistát.
// ==========================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getLeaderboard, startArenaFight, claimArenaVictory } = require('../controllers/arenaController');

router.use(authMiddleware);

router.get('/leaderboard', getLeaderboard);
router.post('/fight', startArenaFight);
router.post('/claim', claimArenaVictory);

module.exports = router;
