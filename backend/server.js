require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sessionConfig = require('./config/session');
const authRoutes = require('./routes/authRoutes');
const validationRuleRoutes = require('./routes/validationRuleRoutes');
const validationRuleSingleRoutes = require('./routes/validationRuleSingleRoutes');
const deployRoutes = require('./routes/deployRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

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

// Routes
app.use('/auth', authRoutes);
app.use('/validation-rules', validationRuleRoutes);
app.use('/validation-rule', validationRuleSingleRoutes);
app.use('/deploy', deployRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Validation Rule Manager API is running' });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`OAuth callback: ${process.env.SF_CALLBACK_URL}`);
});
