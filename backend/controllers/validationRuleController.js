const validationRuleService = require('../services/validationRuleService');

/**
 * GET /validation-rules — Fetch validation rules from Salesforce.
 */
async function getValidationRules(req, res, next) {
  try {
    const rules = await validationRuleService.fetchValidationRules(req.session);
    req.session.validationRules = rules;

    res.json({
      success: true,
      count: rules.length,
      rules,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /validation-rules/cached — Return rules from session cache without re-fetching.
 */
function getCachedValidationRules(req, res) {
  const rules = req.session.validationRules || [];
  const hasPendingChanges = rules.some((r) => r.modified);

  res.json({
    success: true,
    count: rules.length,
    hasPendingChanges,
    rules,
  });
}

/**
 * PATCH /validation-rule/:id — Toggle a single validation rule in cache.
 */
function patchValidationRule(req, res, next) {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Request body must include "active" as a boolean',
      });
    }

    const rule = validationRuleService.updateRuleInCache(req.session, id, active);

    res.json({
      success: true,
      message: `Validation rule "${rule.name}" marked as ${active ? 'active' : 'inactive'}`,
      rule,
      hasPendingChanges: (req.session.validationRules || []).some((r) => r.modified),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /validation-rules/toggle-all — Enable or disable all rules in cache.
 */
function toggleAllValidationRules(req, res, next) {
  try {
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Request body must include "active" as a boolean',
      });
    }

    const rules = validationRuleService.toggleAllInCache(req.session, active);

    res.json({
      success: true,
      message: `All validation rules marked as ${active ? 'active' : 'inactive'}`,
      count: rules.length,
      rules,
      hasPendingChanges: rules.some((r) => r.modified),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /deploy — Push all pending changes to Salesforce.
 */
async function deployChanges(req, res, next) {
  try {
    const result = await validationRuleService.deployChanges(req.session);

    res.json({
      success: true,
      message: `Successfully deployed ${result.deployed} validation rule(s)`,
      ...result,
    });
  } catch (err) {
    if (err.results) {
      return res.status(err.status || 422).json({
        success: false,
        message: err.message,
        results: err.results,
      });
    }
    next(err);
  }
}

module.exports = {
  getValidationRules,
  getCachedValidationRules,
  patchValidationRule,
  toggleAllValidationRules,
  deployChanges,
};
