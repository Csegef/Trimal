// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * JWT middleware – védi az összes /api/inventory route-ot.
 * Feltölti req.user-t: { userId, specieId }
 *
 * A specieId-t a user táblából olvassa, mivel az auth.js-ben
 * userModel.setSpecieId() tárolja el a specie (character) ID-t.
 */
module.exports = async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Nincs token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const pool = req.pool;

    // specieId lekérése a user táblából
    const [rows] = await pool.execute(
      'SELECT id, specie_id FROM user WHERE id = ?',
      [decoded.userId]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'Felhasználó nem található' });
    }

    if (!user.specie_id) {
      return res.status(401).json({ success: false, message: 'Karakter nem found' });
    }

    req.user = {
      userId:   user.id,
      specieId: user.specie_id,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token lejárt' });
    }
    return res.status(401).json({ success: false, message: 'Érvénytelen token' });
  }
};