const mongoose = require('mongoose');

const ShopsSchema = mongoose.Schema({
    shopName: { type: String, default: 'אין שם' }
});

module.exports = mongoose.model('shops', ShopsSchema);