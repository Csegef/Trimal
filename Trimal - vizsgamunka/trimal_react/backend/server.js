// ==========================================
// Fájl: Fő Szerver (Server)
// Cél: A NodeJS / Express háttérrendszer belépési pontja.
//
// Itt indul el az API, itt állítjuk be a CORS szabályokat, az adatbázis kapcsolatot,
// és csatoljuk be a különböző útvonalakat (routes).
// ==========================================
// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Pool hozzáférése a route-ok számára
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// Routok
app.use('/api/auth', require('./routes/auth'));
app.use('/api/character', require('./routes/character'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/quest', require('./routes/quest'));
app.use('/api/effects', require('./routes/effects'));
app.use('/api/entities', require('./routes/entities'));
app.use('/api/arena', require('./routes/arena'));

app.get('/', (req, res) => {
  res.send('Trimal RPG Backend Running with MySQL');
});


// Start Szerver
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});