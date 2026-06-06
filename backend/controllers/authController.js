const jsforce = require("jsforce");
const { createOAuth2 } = require("../config/salesforce");

function getFrontendUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");
}

/**
 * Redirect user to Salesforce OAuth authorization page with PKCE.
 * Salesforce Connected Apps require code_challenge for the authorization request.
 */
function login(req, res) {
  const oauth2 = createOAuth2({ useVerifier: true });

  // Store PKCE verifier in session — required when exchanging the auth code for tokens
  req.session.codeVerifier = oauth2.codeVerifier;

  const authUrl = oauth2.getAuthorizationUrl({
    scope: "api refresh_token",
    code_challenge_method: "S256",
  });

  req.session.save((err) => {
    if (err) {
      console.error("Session save error on login:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to start login" });
    }
    res.redirect(authUrl);
  });
}

/**
 * Handle OAuth callback — exchange authorization code for access tokens using PKCE verifier.
 */
async function callback(req, res) {
  const { code, error, error_description: errorDescription } = req.query;
  const frontendUrl = getFrontendUrl();

  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (!code) {
    return res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent("Authorization code missing")}`,
    );
  }

  if (!req.session.codeVerifier) {
    return res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent("PKCE verifier missing. Please try logging in again.")}`,
    );
  }

  try {
    const oauth2 = createOAuth2({ codeVerifier: req.session.codeVerifier });
    const conn = new jsforce.Connection({ oauth2 });
    const userInfo = await conn.authorize(code, {
      code_verifier: req.session.codeVerifier,
    });

    // Fetch user identity for display name (username, email)
    let identity = {};
    try {
      identity = await conn.identity();
    } catch {
      // Non-fatal — we can still proceed with user id
    }

    // Store OAuth tokens in server-side session
    req.session.accessToken = conn.accessToken;
    req.session.instanceUrl = conn.instanceUrl;
    req.session.refreshToken = conn.refreshToken;
    req.session.userId = userInfo.id;
    req.session.username =
      identity.username || identity.display_name || userInfo.id;
    req.session.validationRules = [];
    delete req.session.codeVerifier;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect(
          `${frontendUrl}/login?error=${encodeURIComponent("Failed to save session")}`,
        );
      }
      res.redirect(`${frontendUrl}/dashboard`);
    });
  } catch (err) {
    console.error("OAuth callback error:", err.message);
    delete req.session.codeVerifier;
    res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(err.message)}`,
    );
  }
}

/**
 * Return current authentication status and user info.
 */
function status(req, res) {
  const authenticated = !!(
    req.session?.accessToken && req.session?.instanceUrl
  );

  res.json({
    success: true,
    authenticated,
    user: authenticated
      ? {
          id: req.session.userId,
          username: req.session.username,
          instanceUrl: req.session.instanceUrl,
        }
      : null,
  });
}

/**
 * Destroy session and log out.
 */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "Logged out successfully" });
  });
}

/**
 * Destroy local session and also redirect browser to Salesforce logout
 * endpoint to remove the Salesforce SSO cookie. After Salesforce logout
 * completes, it will redirect back to the frontend login page.
 */
function logoutAll(req, res) {
  const frontendUrl = getFrontendUrl();
  const instanceUrl = req.session?.instanceUrl;

  // Destroy server-side session and clear cookie first
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error on logoutAll:", err);
      // proceed anyway — we want to attempt to clear Salesforce session
    }
    res.clearCookie("connect.sid");

    if (instanceUrl) {
      const target = `${instanceUrl.replace(/\/$/, "")}/secur/logout.jsp?retUrl=${encodeURIComponent(
        `${frontendUrl}/login?fresh=true`,
      )}`;
      return res.redirect(target);
    }

    // If we don't have an instance URL, just redirect back to frontend login
    return res.redirect(`${frontendUrl}/login?fresh=true`);
  });
}

module.exports = { login, callback, status, logout, logoutAll };
