const mongoose = require('mongoose');

const itemsOnUserSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true, unique: true },
    color: { type: mongoose.Schema.Types.ObjectId, ref: 'items', default: null },
    hair: { type: mongoose.Schema.Types.ObjectId, ref: 'items', default: null },
    hat: { type: mongoose.Schema.Types.ObjectId, ref: 'items', default: null },
    stuff: { type: mongoose.Schema.Types.ObjectId, ref: 'items', default: null },
    necklace: { type: mongoose.Schema.Types.ObjectId, ref: 'items', default: null },
    glasses: { type: mongoose.Schema.Types.ObjectId, ref: 'items', default: null },
    shirt: { type: mongoose.Schema.Types.ObjectId, ref: 'items', default: null },
    pants: { type: mongoose.Schema.Types.ObjectId, ref: 'items', default: null },
    skate: { type: mongoose.Schema.Types.ObjectId, ref: 'items', default: null },
    background: { type: mongoose.Schema.Types.ObjectId, ref: 'items', default: null }
}, { timestamps: true });

module.exports = mongoose.model('itemsonuser', itemsOnUserSchema);