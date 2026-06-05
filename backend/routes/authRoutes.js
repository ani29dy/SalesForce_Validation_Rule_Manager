const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/login', authController.login);
router.get('/callback', authController.callback);
router.get('/status', authController.status);
router.post('/logout', authController.logout);

module.exports = router;
