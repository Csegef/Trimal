const mongoose = require('mongoose');
// {  Lokális játék DB struktúra
//     _id: ObjectId,
//     userId: ObjectId,        // Referencia az Auth DB-re
//     username: String,        // Denormalizálva, gyorsabb lekérdezéshez
//     character: {
//       class: String,         // pl. "neanderthal", "homosapiens"
//       className: String,     // pl. "Neanderthal", "Homo Sapiens"
//       hairStyle: Number,     // 0-5 (0 = Bald)
//       beardStyle: Number     // 0-5 (0 = Shaved)
//     },
//     stats: {                 // Később bővíthető
//       level: Number,
//       experience: Number,
//       // stb.
//     },
//     createdAt: Date,
//     updatedAt: Date
//   }

const CharacterSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    classType: {
        type: String,
        enum: ['neanderthal', 'floresiensis', 'sapiens'],
        required: true
    },
    hairIndex: {
        type: Number,
        required: true,
        default: 0
    },
    beardIndex: {
        type: Number,
        required: true,
        default: 0
    },
    // Add stats or other attributes based on class
    stats: {
        strength: Number,
        agility: Number,
        intelligence: Number
        // ...
    }
});

// REMINDER: When saving a character here, also save to Local DB!

module.exports = mongoose.model('Character', CharacterSchema);
