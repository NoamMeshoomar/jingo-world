const express = require('express');

const router = express.Router();

const auth = require('../utils/verifyToken');

const {
    getCurrentUser,
    register,
    authUser,
    ban,
    mute
} = require('../controllers/users');

router.get('/authuser', auth, authUser);
router.get('/current-user/:id', getCurrentUser);
router.post('/register', register);
router.put('/ban', auth, ban);
router.put('/mute', auth, mute);

module.exports = router;