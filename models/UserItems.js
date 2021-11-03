const mongoose = require('mongoose');

const UserItemsSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'items', required: true }
}, { timestamps: true });

module.exports = mongoose.model('useritems', UserItemsSchema);