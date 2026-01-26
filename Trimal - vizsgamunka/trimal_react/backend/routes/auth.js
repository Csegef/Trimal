const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Character = require('../models/Character');
const localDB = require('../localDB');

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// @route   POST api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, character } = req.body;

        // 1. Validate input
        if (!username || !email || !password || !character) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ success: false, message: 'Username must be 3-20 characters' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }

        // 2. Check if user exists in Mongo AND Local DB
        const existingUserMongo = await User.findOne({ $or: [{ email }, { username }] });
        const existingUsersLocal = localDB.getUsers();
        const existingUserLocal = existingUsersLocal.find(u => u.email === email || u.username === username);

        if (existingUserMongo || existingUserLocal) {
            return res.status(400).json({ success: false, message: 'Email vagy username már használatban van' });
        }

        // 3. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Save to Mongo
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });
        const savedUser = await newUser.save();

        // 5. Save to Local DB
        const localUser = {
            id: savedUser._id.toString(),
            username,
            email,
            password: hashedPassword,
            createdAt: savedUser.createdAt,
            updatedAt: savedUser.updatedAt
        };
        existingUsersLocal.push(localUser);
        localDB.saveUsers(existingUsersLocal);

        // Character save (Mongo + Local)
        const newCharacter = new Character({
            userId: savedUser._id,
            username,
            character: {
                class: character.class,
                className: character.className,
                hairStyle: character.hairStyle,
                beardStyle: character.beardStyle
            }
        });
        const savedCharacter = await newCharacter.save();

        const existingCharsLocal = localDB.getCharacters();
        const localChar = {
            id: savedCharacter._id.toString(),
            userId: savedUser._id.toString(),
            username,
            character: {
                class: character.class,
                className: character.className,
                hairStyle: character.hairStyle,
                beardStyle: character.beardStyle
            },
            stats: savedCharacter.stats,
            createdAt: savedCharacter.createdAt,
            updatedAt: savedCharacter.updatedAt
        };
        existingCharsLocal.push(localChar);
        localDB.saveCharacters(existingCharsLocal);

        // 6. Return token (JWT)
        const payload = { userId: savedUser._id };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            success: true,
            token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email
            },
            character: {
                id: savedCharacter._id,
                class: savedCharacter.character.class,
                className: savedCharacter.character.className
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Missing fields' });
        }

        // Check MongoDB
        const userMongo = await User.findOne({ email });
        if (!userMongo) {
            return res.status(400).json({ success: false, message: 'Email nem található' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, userMongo.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Hibás jelszó' });
        }

        // JWT
        const token = jwt.sign({ userId: userMongo._id }, JWT_SECRET, { expiresIn: '7d' });

        return res.json({
            success: true,
            token,
            user: {
                id: userMongo._id,
                username: userMongo.username,
                email: userMongo.email
            }
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;