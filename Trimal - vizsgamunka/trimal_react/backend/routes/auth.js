// ==========================================
// Fájl: Hitelesítési Útvonalak (Auth Routes)
// Cél: A regisztráció, bejelentkezés, jelszó visszaállítás végpontjai.
//
// Ez a fájl kezeli a JWT tokenek kiosztását és a felhasználók beléptetését.
// ==========================================
// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Character = require('../models/Character');
const { sendWelcomeEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const pool = req.pool;
  const { nickname, email, password, character } = req.body;
  const crypto = require('crypto');
  const fs = require('fs');

  const logError = (msg) => {
    fs.appendFileSync('error.log', new Date().toISOString() + ' - ' + msg + '\n');
  };

  logError(`Attempting registration for: ${email}, ${nickname}`);

  if (!nickname || !email || !password || !character || !character.specie_name) {
    logError('Missing data');
    return res.status(400).json({ success: false, message: 'Missing data' });
  }

  const userModel = new User(pool);
  const charModel = new Character(pool);

  try {
    logError('Checking existing user');
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      logError('User exists');
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    logError('Creating user...');
    // 1. User létrehozása
    const newUser = await userModel.create({ nickname, email, password, verification_token: verificationToken });
    logError(`User created with ID: ${newUser.id}`);

    logError('Creating character...');

    // Véletlenszerű küldetések betöltése
    const [easyQuests] = await pool.execute('SELECT quest_id FROM quest WHERE difficulty = "easy"');
    const [mediumQuests] = await pool.execute('SELECT quest_id FROM quest WHERE difficulty = "medium"');
    const [hardQuests] = await pool.execute('SELECT quest_id FROM quest WHERE difficulty = "hard"');

    let q1 = null, q2 = null, q3 = null;
    if (easyQuests.length > 0) q1 = easyQuests[Math.floor(Math.random() * easyQuests.length)].quest_id;
    if (mediumQuests.length > 0) q2 = mediumQuests[Math.floor(Math.random() * mediumQuests.length)].quest_id;
    if (hardQuests.length > 0) q3 = hardQuests[Math.floor(Math.random() * hardQuests.length)].quest_id;

    // DEFAULT INVENTORY
    const defaultInventory = {
      capacity: 200,
      used: 0,
      currency: {
        normal: 0,
        spec: 0
      },
      items: [],
      equipped: {
        weapon: null,
        armor_head: null,
        armor_chest: null,
        armor_legs: null,
        armor_feet: null
      },
      stamina: {
        current: 100,
        max: 100,
        last_reset: Math.floor(Date.now() / 1000)
      },
      active_quest: null,
      active_buffs: [],
      achievements: {
        enemiesEnc: [],
        weaponsEnc: [],
        armorsEnc: [],
        foodsEnc: [],
        maxCrits: 0,
        flawlessWins: 0,
        deaths: 0,
        spentNormal: 0,
        foundLegendary: false,
        hoarderAchieved: false,
        claimedRewards: []
      }
    };

    // 2. Karakter létrehozása
    const newChar = await charModel.create({
      userId: newUser.id,
      specie_name: character.specie_name,
      hair_style: character.hair_style || null,
      beard_style: character.beard_style || null,
      inventory_json: JSON.stringify(defaultInventory),
      quest_1: q1,
      quest_2: q2,
      quest_3: q3
    });
    logError('Character created');

    logError('Generating initial shop items...');
    const { generateShopItemsForDay } = require('../controllers/shopController');
    await generateShopItemsForDay(pool, newChar.id);
    logError('Initial shop items generated');

    // 2.5 User frissítése a Specie ID-val
    await userModel.setSpecieId(newUser.id, newChar.id);
    logError('User linked to character');

    // 3. Email küldése
    const { sendVerificationEmail } = require('../utils/mailer');
    logError('Sending email...');
    sendVerificationEmail(email, nickname, verificationToken).catch(err => logError('Email send failed: ' + err));

    res.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.'
    });

  } catch (err) {
    console.error(err);
    logError('EXCEPTION: ' + err.stack);
    res.status(500).json({ success: false, message: 'Error during registration: ' + err.message });
  }
});

// GET /api/auth/verify-email
router.get('/verify-email', async (req, res) => {
  const pool = req.pool;
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Missing token' });
  }

  try {
    const [users] = await pool.execute('SELECT * FROM user WHERE verification_token = ?', [token]);
    const user = users[0];

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    await pool.execute('UPDATE user SET is_verified = 1, verification_token = NULL, status = 1 WHERE id = ?', [user.id]);

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const pool = req.pool;
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Missing data' });
  }

  const userModel = new User(pool);
  const charModel = new Character(pool);

  try {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    if (user.is_verified === 0) {
      return res.status(401).json({ success: false, message: 'Please verify your email address before logging in.' });
    }

    const valid = await userModel.checkPassword(user, password);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    const characters = await charModel.findByUserId(user.id);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user.id, nickname: user.nickname, email: user.email },
      character: characters[0] || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error during login' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const pool = req.pool;
  const token = req.headers.authorization?.split(' ')[1]; // Bearer token

  try {
    if (token) {
      // Sikerüzenet küldése
      // A kliens oldalon úgyis törlődik a token
    }

    res.json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const pool = req.pool;
  const { email } = req.body;
  const crypto = require('crypto');

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }

  try {
    const userModel = new User(pool);
    const user = await userModel.findByEmail(email);

    if (!user) {
      // Biztonsági okokból sikerüzenet, ha nincs usert
      return res.json({ success: true, message: 'If the email exists, a reset link was sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    // Token lejárata 1 óra
    const expires = new Date(Date.now() + 3600000);

    await userModel.setResetToken(email, resetToken, expires);

    const { sendPasswordResetEmail } = require('../utils/mailer');
    const sent = await sendPasswordResetEmail(email, user.nickname, resetToken);

    if (sent) {
      res.json({ success: true, message: 'If the email exists, a reset link was sent.' });
    } else {
      res.status(500).json({ success: false, message: 'Error sending email' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const pool = req.pool;
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Missing token or new password' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  try {
    const userModel = new User(pool);
    const user = await userModel.findByResetToken(token);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    await userModel.updatePassword(user.id, newPassword);

    res.json({ success: true, message: 'Password successfully reset' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

module.exports = router;