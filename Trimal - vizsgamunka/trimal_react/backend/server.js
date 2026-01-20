const express = require('express');
const cors = require('cors');
// const mongoose = require('mongoose'); // Uncomment when setting up DB

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// TODO: Database Connections
// REQUIREMENT: Store data in BOTH MongoDB and a Local Database (e.g., JSON file or SQLite).
// 
// 1. MongoDB Connection:
// mongoose.connect('mongodb://localhost:27017/trimal_rpg', { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('MongoDB Connected'))
//   .catch(err => console.log(err));
//
// 2. Local Database:
// Setup a local storage mechanism (fs module for JSON or similar).

// Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => {
    res.send('Trimal RPG Backend Running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
