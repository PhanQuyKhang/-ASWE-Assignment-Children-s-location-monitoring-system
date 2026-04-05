const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.get('/google/start', AuthController.googleStart);
router.get('/google/callback', AuthController.googleCallback);
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.post('/change-password', authMiddleware, AuthController.changePassword);
router.post('/password-reset/request', AuthController.requestPasswordReset);
router.post('/password-reset/confirm', AuthController.confirmPasswordReset);

module.exports = router;
