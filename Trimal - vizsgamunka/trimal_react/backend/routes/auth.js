const express = require('express');
const router = express.Router();
// const User = require('../models/User');

// @route   POST api/auth/register
// {
//     "username": "string",
//     "email": "string",
//     "password": "string",
//     "character": {
//       "class": "string",
//       "className": "string",
//       "hairStyle": number,
//       "beardStyle": number
//     }
//   }
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

// { -----------------Success response
//     "success": true,
//     "token": "jwt_token_here",
//     "user": {
//       "id": "user_id",
//       "username": "username",
//       "email": "email"
//     },
//     "character": {
//       "id": "character_id",
//       "class": "neanderthal",
//       "className": "Neanderthal"
//     }
//   }
// { ---------------Error response
//     "success": false,
//     "message": "Email már használatban van" // vagy más hiba
//   }


// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    // Logic here
    res.send('Login route');
});

module.exports = router;
