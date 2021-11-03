const mongoose = require('mongoose');

const ItemOnShopSchema = mongoose.Schema({
    shopId: { type: mongoose.Types.ObjectId, ref: 'shops', required: true },
    itemId: { type: mongoose.Types.ObjectId, ref: 'items', required: true },
    price: { type: Number, default: 0 }
});

module.exports = mongoose.model('itemsonshops', ItemOnShopSchema);