const session = require('express-session');

/**
 * Express session configuration.
 * Stores OAuth tokens and cached validation rules server-side.
 */
function sessionConfig() {
  return session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  });
}

module.exports = sessionConfig;
