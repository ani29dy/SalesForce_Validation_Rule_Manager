require('dotenv').config();
const jsforce = require('jsforce');

const baseOAuth2Config = {
  loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
  clientId: process.env.SF_CLIENT_ID,
  clientSecret: process.env.SF_CLIENT_SECRET,
  redirectUri: process.env.SF_CALLBACK_URL,
};

/**
 * Create an OAuth2 instance for a login/callback flow.
 * When starting login, pass useVerifier=true to generate PKCE values.
 * When handling callback, pass the stored codeVerifier from session.
 */
function createOAuth2({ useVerifier = false, codeVerifier = null } = {}) {
  const oauth2 = new jsforce.OAuth2({
    ...baseOAuth2Config,
    useVerifier,
  });

  if (codeVerifier) {
    oauth2.codeVerifier = codeVerifier;
  }

  return oauth2;
}

/**
 * Create an authenticated jsforce Connection from stored session tokens.
 */
function createConnection(session) {
  if (!session?.accessToken || !session?.instanceUrl) {
    return null;
  }

  return new jsforce.Connection({
    oauth2: createOAuth2(),
    accessToken: session.accessToken,
    instanceUrl: session.instanceUrl,
    refreshToken: session.refreshToken,
  });
}

module.exports = { createOAuth2, createConnection };
