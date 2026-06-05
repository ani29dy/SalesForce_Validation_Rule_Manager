# Salesforce Validation Rule Manager

A production-ready web application for managing Salesforce Validation Rules. Connect to your Salesforce Developer Org via OAuth 2.0, fetch validation rules using the Tooling API, toggle them on/off, and deploy changes back to Salesforce — all from a modern React dashboard.

## Features

- **Salesforce OAuth 2.0** — Secure login with your Developer Org
- **Fetch Validation Rules** — Query all rules via Tooling API (`ValidationRule`)
- **Toggle Rules** — Activate/deactivate individual rules with toggle switches
- **Bulk Actions** — Enable All / Disable All with one click
- **Deploy Changes** — Push pending changes back to Salesforce
- **Search & Filter** — Find rules by name and filter by active/inactive status
- **Modern UI** — Responsive Tailwind CSS dashboard with toast notifications and deploy modal

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Axios |
| Backend  | Node.js, Express, jsforce           |
| Auth     | Salesforce OAuth 2.0 (Web Server Flow)|
| API      | Salesforce Tooling API              |

## Project Structure

```
Validation_Rule_Manager/
├── backend/
│   ├── config/          # Salesforce OAuth & session config
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth & error handling
│   ├── routes/          # API route definitions
│   ├── services/        # Salesforce & validation rule logic
│   ├── server.js        # Express entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # Auth & Toast context providers
│   │   ├── pages/       # Login & Dashboard pages
│   │   └── services/    # Axios API client
│   └── .env.example
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A Salesforce Developer Org
- A Salesforce Connected App with OAuth enabled

## Salesforce Connected App Setup

1. Log in to your Salesforce Developer Org
2. Go to **Setup → App Manager → New Connected App**
3. Configure:
   - **Connected App Name**: Validation Rule Manager
   - **Enable OAuth Settings**: ✅ Checked
   - **Callback URL**: `http://localhost:5000/auth/callback`
   - **Selected OAuth Scopes**:
     - Access and manage your data (api)
     - Perform requests at any time (refresh_token, offline_access)
4. Save and note the **Consumer Key** (Client ID) and **Consumer Secret** (Client Secret)
5. Under **Manage Connected App**, click **Edit Policies**:
   - Set **Permitted Users** to "All users may self-authorize" (for dev)
   - Set **IP Relaxation** to "Relax IP restrictions" (for local dev)

## Installation

### 1. Clone and install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

**Backend** — copy and edit `.env`:

```bash
cd backend
cp .env.example .env
```

```env
PORT=5000
SF_LOGIN_URL=https://login.salesforce.com
SF_CLIENT_ID=your_connected_app_consumer_key
SF_CLIENT_SECRET=your_connected_app_consumer_secret
SF_CALLBACK_URL=http://localhost:5000/auth/callback
SESSION_SECRET=generate_a_random_secret_string
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend** — copy and edit `.env`:

```bash
cd frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000
```

### 3. Run the application

Open two terminal windows:

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

1. Click **Login with Salesforce** on the login page
2. Authorize the Connected App in Salesforce
3. You'll be redirected to the **Dashboard**
4. Click **Fetch Validation Rules** to load rules from your org
5. Use toggle switches to activate/deactivate rules
6. Use **Enable All** / **Disable All** for bulk changes
7. Click **Deploy Changes** to push pending modifications to Salesforce

## API Endpoints

| Method | Endpoint                      | Description                          |
|--------|-------------------------------|--------------------------------------|
| GET    | `/auth/login`                 | Redirect to Salesforce OAuth         |
| GET    | `/auth/callback`              | OAuth callback handler               |
| GET    | `/auth/status`                | Check authentication status          |
| POST   | `/auth/logout`                | End session                          |
| GET    | `/validation-rules`           | Fetch rules from Salesforce          |
| GET    | `/validation-rules/cached`    | Get cached rules from session        |
| PATCH  | `/validation-rule/:id`        | Toggle a single rule (cache)         |
| PATCH  | `/validation-rules/toggle-all`| Enable/disable all rules (cache)     |
| POST   | `/deploy`                     | Deploy pending changes to Salesforce |
| GET    | `/health`                     | Health check                         |

## Architecture Notes

- **Session-based auth**: OAuth tokens are stored server-side in Express sessions (not exposed to the browser)
- **Staging changes**: Toggle actions update a server-side cache; changes are marked as `modified` until deployed
- **Tooling API**: All Salesforce operations use `jsforce` with the Tooling API for `ValidationRule` objects
- **CORS**: Configured to allow the frontend origin with credentials

## Production Deployment (Render)

Full step-by-step hosting guide: **[DEPLOY_RENDER.md](./DEPLOY_RENDER.md)**

Quick summary:

1. Push code to GitHub/GitLab
2. Deploy **backend** Web Service (`backend/`, start: `npm start`)
3. Deploy **frontend** Static Site (`frontend/`, build: `npm run build`, publish: `dist`)
4. Set environment variables on both services
5. Update Salesforce Connected App callback URL to your Render backend URL

A `render.yaml` Blueprint is included for one-click dual-service deploy.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| OAuth redirect fails | Verify Callback URL matches exactly in Connected App settings |
| CORS errors | Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL |
| Session not persisting | Check that axios requests use `withCredentials: true` |
| No validation rules found | Ensure your org has validation rules and your user has Tooling API access |
| Deploy fails | Check Salesforce permissions — user needs "Modify Metadata" or System Administrator profile |

## License

MIT
