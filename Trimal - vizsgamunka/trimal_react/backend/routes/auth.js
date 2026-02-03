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

  if (!nickname || !email || !password || !character || !character.specie_name) {
    return res.status(400).json({ success: false, message: 'Hiányzó adatok' });
  }

  const userModel = new User(pool);
  const charModel = new Character(pool);

  try {
    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email már használatban van' });
    }

    // 1. Create User
    const newUser = await userModel.create({ nickname, email, password });

    // 2. Create Character
    const newChar = await charModel.create({
      userId: newUser.id,
      specie_name: character.specie_name,
      hair_style: character.hair_style || null,
      beard_style: character.beard_style || null
    });

    // 3. Create JWT
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    // 4. Send Welcome Email
    // We don't await this so it doesn't block the response if SMTP is slow
    sendWelcomeEmail(email, nickname).catch(err => console.error('Email send failed:', err));

    res.json({
      success: true,
      token,
      user: newUser,
      character: newChar
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Hiba a regisztráció során' });
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