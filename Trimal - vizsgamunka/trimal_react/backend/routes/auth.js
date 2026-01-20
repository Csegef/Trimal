const express = require('express');
const router = express.Router();
// const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    // 1. Validate input
    // 2. Check if user exists in Mongo AND Local DB
    // 3. Hash password
    // 4. Save to Mongo
    // 5. Save to Local DB
    // 6. Return token (JWT)
    res.send('Register route');
});

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    // Logic here
    res.send('Login route');
});

module.exports = router;
