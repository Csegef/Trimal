const mongoose = require('mongoose');

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
