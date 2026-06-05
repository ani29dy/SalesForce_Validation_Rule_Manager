require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const sessionConfig = require('./config/session');
const authRoutes = require('./routes/authRoutes');
const validationRuleRoutes = require('./routes/validationRuleRoutes');
const validationRuleSingleRoutes = require('./routes/validationRuleSingleRoutes');
const deployRoutes = require('./routes/deployRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const publicPath = path.join(__dirname, 'public');
const servesFrontend =
  process.env.NODE_ENV === 'production' && fs.existsSync(publicPath);

// When frontend is served from this server, use the same origin for OAuth redirects
const FRONTEND_URL = (
  process.env.FRONTEND_URL ||
  (servesFrontend ? process.env.RENDER_EXTERNAL_URL : null) ||
  'http://localhost:5173'
).replace(/\/$/, '');

// Render (and other reverse proxies) sit in front of the app — required for secure cookies
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(sessionConfig());

// API routes
app.use('/auth', authRoutes);
app.use('/validation-rules', validationRuleRoutes);
app.use('/validation-rule', validationRuleSingleRoutes);
app.use('/deploy', deployRoutes);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Validation Rule Manager API is running',
    servesFrontend,
  });
});

// Serve React app (single-service Render deploy — fixes /login and /dashboard 404s)
if (servesFrontend) {
  app.use(express.static(publicPath));

  app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(publicPath, 'salesforce-icon.svg'));
  });

  // SPA fallback — all non-API routes serve index.html for React Router
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/auth') ||
      req.path.startsWith('/validation') ||
      req.path.startsWith('/deploy') ||
      req.path === '/health'
    ) {
      return next();
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`OAuth callback: ${process.env.SF_CALLBACK_URL}`);
  console.log(`Serving React UI: ${servesFrontend ? 'yes' : 'no (API only)'}`);
});
