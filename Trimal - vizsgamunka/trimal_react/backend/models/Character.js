const mongoose = require('mongoose');

const CharacterSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    character: {
        class: {
            type: String,
            enum: ['neanderthal', 'floresiensis', 'sapiens'],
            required: true
        },
        className: {
            type: String,
            required: true
        },
        hairStyle: {
            type: Number,
            default: 0
        },
        beardStyle: {
            type: Number,
            default: 0
        }
    },
    stats: {
        level: { type: Number, default: 1 },
        experience: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Character', CharacterSchema);