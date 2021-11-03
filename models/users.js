const mongoose = require('mongoose');

const usersSchema = mongoose.Schema({
    username: { type: String, required: true, unique: true },
    displayedUsername: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    money: { type: Number, default: 20 },
    room: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('users', usersSchema);