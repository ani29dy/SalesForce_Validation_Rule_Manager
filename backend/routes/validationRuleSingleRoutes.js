const express = require('express');
const validationRuleController = require('../controllers/validationRuleController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.patch('/:id', requireAuth, validationRuleController.patchValidationRule);

module.exports = router;
