const express = require('express');

const router = express.Router();

const auth = require('../utils/verifyToken');

const {
    getShop,
    buyItem
} = require('../controllers/shops');

router.get('/shop/:shopId', auth, getShop);
router.post('/buy/:shopItemId', auth, buyItem);

module.exports = router;