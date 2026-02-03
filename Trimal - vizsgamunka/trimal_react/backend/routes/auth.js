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
    return res.status(400).json({ success: false, message: 'Hiányzó adatok' });
  }

  const userModel = new User(pool);
  const charModel = new Character(pool);

  try {
    logError('Checking existing user');
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      logError('User exists');
      return res.status(400).json({ success: false, message: 'Email már használatban van' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    logError('Creating user...');
    // 1. Create User
    const newUser = await userModel.create({ nickname, email, password, verification_token: verificationToken });
    logError(`User created with ID: ${newUser.id}`);

    logError('Creating character...');
    // 2. Create Character
    const newChar = await charModel.create({
      userId: newUser.id,
      specie_name: character.specie_name,
      hair_style: character.hair_style || null,
      beard_style: character.beard_style || null
    });
    logError('Character created');

    // 2.5 Update User with Specie ID
    await userModel.setSpecieId(newUser.id, newChar.id);
    logError('User linked to character');

    // 3. Send Verification Email
    const { sendVerificationEmail } = require('../utils/mailer');
    logError('Sending email...');
    sendVerificationEmail(email, nickname, verificationToken).catch(err => logError('Email send failed: ' + err));

    res.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.'
    });

  } catch (err) {
    console.error(err);
    logError('EXCEPTION: ' + err.stack); // Log full stack trace
    res.status(500).json({ success: false, message: 'Hiba a regisztráció során: ' + err.message });
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
    return res.status(400).json({ success: false, message: 'Hiányzó adatok' });
  }

  const userModel = new User(pool);
  const charModel = new Character(pool);

  try {
    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Felhasználó nem található' });
    }

    if (user.is_verified === 0) {
      return res.status(401).json({ success: false, message: 'Please verify your email address before logging in.' });
    }

    const valid = await userModel.checkPassword(user, password);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Hibás jelszó' });
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
    res.status(500).json({ success: false, message: 'Hiba a belépés során' });
  }
});

module.exports = router;