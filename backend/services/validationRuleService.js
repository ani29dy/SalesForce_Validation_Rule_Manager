const { getConnection, syncSessionTokens } = require('./salesforceService');

const VALIDATION_RULE_QUERY =
  'SELECT Id, ValidationName, Active, Description, ErrorMessage, ErrorDisplayField, EntityDefinition.QualifiedApiName FROM ValidationRule ORDER BY ValidationName';

/**
 * Fetch all validation rules from Salesforce via the Tooling API.
 */
async function fetchValidationRules(session) {
  const conn = getConnection(session);
  const result = await conn.tooling.query(VALIDATION_RULE_QUERY);
  syncSessionTokens(session, conn);

  return result.records.map((record) => ({
    id: record.Id,
    name: record.ValidationName,
    active: record.Active,
    objectName: record.EntityDefinition?.QualifiedApiName || 'Unknown',
    description: record.Description || null,
    errorMessage: record.ErrorMessage || null,
    errorDisplayField: record.ErrorDisplayField || null,
    modified: false,
  }));
}

/**
 * Update a single validation rule's Active status in the session cache.
 */
function updateRuleInCache(session, ruleId, active) {
  const rules = session.validationRules || [];
  const rule = rules.find((r) => r.id === ruleId);

  if (!rule) {
    const error = new Error(`Validation rule with id ${ruleId} not found`);
    error.status = 404;
    throw error;
  }

  const statusChanged = rule.active !== active;
  rule.active = active;
  rule.modified = rule.modified || statusChanged;
  session.validationRules = rules;
  return rule;
}

/**
 * Toggle all validation rules in the session cache.
 */
function toggleAllInCache(session, active) {
  const rules = (session.validationRules || []).map((rule) => ({
    ...rule,
    active,
    // Only mark pending if the status actually changed (or was already pending)
    modified: rule.modified || rule.active !== active,
  }));

  session.validationRules = rules;
  return rules;
}

/**
 * Normalize errorDisplayField for Metadata API.
 * "Top of Page" is a UI label, not a field — including it causes
 * "no CustomField named Account.Top of Page found" errors.
 * Metadata expects the bare field API name (e.g. "MyField__c"), not "Object.Field".
 */
function normalizeErrorDisplayField(value) {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const fieldPart = trimmed.includes('.') ? trimmed.split('.').pop().trim() : trimmed;
  if (!fieldPart || fieldPart.toLowerCase() === 'top of page') return null;

  return fieldPart;
}

/**
 * Build the Metadata payload required by Salesforce Tooling API.
 * ValidationRule updates cannot patch Active alone — Metadata must include
 * errorConditionFormula (ValidationFormula) and errorMessage.
 */
function buildMetadataPayload(existing, active) {
  const metadata = existing.Metadata || {};

  const errorConditionFormula = metadata.errorConditionFormula;
  const errorMessage = metadata.errorMessage || existing.ErrorMessage;

  if (!errorConditionFormula) {
    const error = new Error(
      'Missing validation formula. Managed or protected rules cannot be modified via API.',
    );
    error.status = 422;
    throw error;
  }

  if (!errorMessage) {
    const error = new Error('Missing error message for validation rule.');
    error.status = 422;
    throw error;
  }

  const payload = {
    Metadata: {
      active,
      errorConditionFormula,
      errorMessage,
    },
  };

  const description = metadata.description ?? existing.Description;
  if (description != null) {
    payload.Metadata.description = description;
  }

  const errorDisplayField = normalizeErrorDisplayField(
    metadata.errorDisplayField ?? existing.ErrorDisplayField,
  );
  if (errorDisplayField) {
    payload.Metadata.errorDisplayField = errorDisplayField;
  }

  if (existing.FullName) {
    payload.FullName = existing.FullName;
  }

  return payload;
}

/**
 * Deploy a single validation rule by retrieving its full metadata first,
 * then PATCHing with the required Metadata wrapper.
 */
async function deployValidationRule(conn, rule) {
  const existing = await conn.tooling.retrieve('ValidationRule', rule.id);
  const updatePayload = {
    Id: rule.id,
    ...buildMetadataPayload(existing, rule.active),
  };

  return conn.tooling.update('ValidationRule', updatePayload);
}

/**
 * Deploy all modified validation rules back to Salesforce via Tooling API.
 */
async function deployChanges(session) {
  const conn = getConnection(session);
  const rules = session.validationRules || [];
  const modifiedRules = rules.filter((r) => r.modified);

  if (modifiedRules.length === 0) {
    return { deployed: 0, results: [] };
  }

  const results = [];

  for (const rule of modifiedRules) {
    try {
      const result = await deployValidationRule(conn, rule);

      const success = result.success !== false;
      const errors = result.errors || [];

      results.push({
        id: rule.id,
        name: rule.name,
        success,
        errors,
      });

      if (success) {
        rule.modified = false;
      }
    } catch (err) {
      results.push({
        id: rule.id,
        name: rule.name,
        success: false,
        errors: [{ message: err.message }],
      });
    }
  }

  syncSessionTokens(session, conn);
  session.validationRules = rules;

  const failed = results.filter((r) => !r.success);
  if (failed.length > 0) {
    const firstError = failed[0].errors?.[0]?.message || 'Unknown error';
    const error = new Error(
      failed.length === 1
        ? `Failed to deploy "${failed[0].name}": ${firstError}`
        : `Failed to deploy ${failed.length} validation rule(s). First error: ${firstError}`,
    );
    error.status = 422;
    error.results = results;
    throw error;
  }

  return { deployed: results.length, results };
}

module.exports = {
  fetchValidationRules,
  updateRuleInCache,
  toggleAllInCache,
  deployChanges,
};
