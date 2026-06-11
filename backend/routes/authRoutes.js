const express = require('express');
const router = express.Router();
const { register, login, getMe, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/profile/:username', getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
