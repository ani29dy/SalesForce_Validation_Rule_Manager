/**
 * Ensures the user has completed Salesforce OAuth before accessing protected routes.
 */
function requireAuth(req, res, next) {
  if (!req.session?.accessToken || !req.session?.instanceUrl) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated. Please login with Salesforce.',
    });
  }
  next();
}

module.exports = { requireAuth };
