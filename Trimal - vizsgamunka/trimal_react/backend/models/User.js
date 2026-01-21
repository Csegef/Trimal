const mongoose = require('mongoose');

// { MongoDB Auth DB struktúra:
//     _id: ObjectId,
//     username: String,        // Egyedi, minimum 3, maximum 20 karakter
//     email: String,           // Egyedi, email formátum validálás
//     password: String,        // Bcrypt hash-elve (min. 8 karakter)
//     createdAt: Date,
//     updatedAt: Date
//   }


const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // Add reference to characters or other data
    // characters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Character' }]
});

// REMINDER: When saving a user here, also save to Local DB!

module.exports = mongoose.model('User', UserSchema);
