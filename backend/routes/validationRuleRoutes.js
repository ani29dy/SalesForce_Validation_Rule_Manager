const express = require('express');
const validationRuleController = require('../controllers/validationRuleController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// All validation rule routes require Salesforce authentication
router.use(requireAuth);

router.get('/', validationRuleController.getValidationRules);
router.get('/cached', validationRuleController.getCachedValidationRules);
router.patch('/toggle-all', validationRuleController.toggleAllValidationRules);

module.exports = router;
