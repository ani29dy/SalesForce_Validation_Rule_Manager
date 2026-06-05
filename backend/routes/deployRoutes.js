const express = require('express');
const validationRuleController = require('../controllers/validationRuleController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', requireAuth, validationRuleController.deployChanges);

module.exports = router;
