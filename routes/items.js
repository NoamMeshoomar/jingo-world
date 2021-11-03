const express = require('express');

const router = express.Router();

const { uploadItem } = require('../controllers/items');

const upload = require('../utils/uploadImages');
const auth = require('../utils/verifyToken');

router.post('/upload/:category', auth, upload.single('file'), uploadItem);

module.exports = router;