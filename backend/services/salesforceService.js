const { createConnection } = require('../config/salesforce');

/**
 * Build a jsforce Connection from the current Express session.
 */
function getConnection(session) {
  const conn = createConnection(session);
  if (!conn) {
    const error = new Error('Salesforce connection not available');
    error.status = 401;
    throw error;
  }
  return conn;
}

/**
 * Persist refreshed OAuth tokens back into the session if jsforce refreshed them.
 */
function syncSessionTokens(session, conn) {
  if (conn.accessToken) session.accessToken = conn.accessToken;
  if (conn.instanceUrl) session.instanceUrl = conn.instanceUrl;
  if (conn.refreshToken) session.refreshToken = conn.refreshToken;
}

module.exports = { getConnection, syncSessionTokens };
