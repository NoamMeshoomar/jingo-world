const express = require('express');

const router = express.Router();

const { 
    getUserCategoryItems,
    giveItem
} = require('../controllers/userItems');

const auth = require('../utils/verifyToken');

router.get('/:category', auth, getUserCategoryItems);
router.post('/giveitem', auth, giveItem);

module.exports = router;