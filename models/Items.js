const mongoose = require('mongoose');

const itemsSchema = mongoose.Schema({
    itemImage: { type: String, required: true, unique: true },
    itemName: { type: String, required: true },
    position: { type: Object },
    category: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('items', itemsSchema);