# Deploy to Render

Step-by-step guide to host the **Validation Rule Manager** on [Render](https://render.com) with separate backend (Web Service) and frontend (Static Site) services.

## Architecture on Render

```
User Browser
    │
    ├─► Frontend (Static Site)     https://validation-rule-manager-ui.onrender.com
    │       React app, login button redirects to backend /auth/login
    │
    └─► Backend (Web Service)      https://validation-rule-manager-api.onrender.com
            Express API, OAuth callback, Salesforce integration
                    │
                    └─► Salesforce OAuth + Tooling API
```

## Prerequisites

Before deploying, make sure you have:

1. A [Render](https://render.com) account (free tier works)
2. This project pushed to **GitHub**, **GitLab**, or **Bitbucket**
3. A Salesforce Developer Org with a Connected App
4. Your Salesforce **Consumer Key** and **Consumer Secret**

---

## Part 1 — Prepare Salesforce Connected App

You will update the callback URL after the backend is deployed. For now, note these settings:

1. Log in to Salesforce → **Setup** → **App Manager**
2. Open your Connected App (or create one)
3. Under **OAuth Settings**:
   - **Callback URL** — you will add your Render backend URL in Part 3
   - **Selected OAuth Scopes**:
     - `Access and manage your data (api)`
     - `Perform requests at any time (refresh_token, offline_access)`
4. Under **Manage Connected App → Edit Policies**:
   - **Permitted Users**: All users may self-authorize (for dev/testing)
   - **IP Relaxation**: Relax IP restrictions

---

## Part 2 — Push Code to Git

Render deploys from a Git repository. If you haven't already:

```bash
cd Validation_Rule_Manager
git init
git add .
git commit -m "Initial commit — Validation Rule Manager"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/validation-rule-manager.git
git push -u origin main
```

> Do **not** commit `.env` files. They are already in `.gitignore`.

---

## Part 3 — Deploy the Backend (Web Service)

Deploy the backend **first** so you have the API URL for the frontend and Salesforce.

### Option A: One-click Blueprint (recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Blueprint**
3. Connect your Git repository
4. Render detects `render.yaml` — review the two services
5. Click **Apply**
6. When prompted, enter the secret environment variables for the **API service**:
   - `SF_CLIENT_ID` — your Salesforce Consumer Key
   - `SF_CLIENT_SECRET` — your Salesforce Consumer Secret
7. Leave `SF_CALLBACK_URL` and `FRONTEND_URL` empty for now — you'll set them in Part 5
8. Wait for the backend deploy to finish

### Option B: Manual Web Service setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your Git repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `validation-rule-manager-api` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free (or paid for always-on) |

5. Add **Environment Variables**:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | Click **Generate** (or use a long random string) |
| `SF_LOGIN_URL` | `https://login.salesforce.com` |
| `SF_CLIENT_ID` | Your Salesforce Consumer Key |
| `SF_CLIENT_SECRET` | Your Salesforce Consumer Secret |
| `SF_CALLBACK_URL` | *(set in Part 5)* |
| `FRONTEND_URL` | *(set in Part 5)* |

> `PORT` is set automatically by Render — do not override it.

6. Under **Advanced**, set **Health Check Path** to `/health`
7. Click **Create Web Service**
8. Wait for deploy to complete

### Copy your backend URL

After deploy, copy the backend URL from the Render dashboard, e.g.:

```
https://validation-rule-manager-api.onrender.com
```

Test it:

```
https://validation-rule-manager-api.onrender.com/health
```

You should see: `{"success":true,"message":"Validation Rule Manager API is running"}`

---

## Part 4 — Deploy the Frontend (Static Site)

### Option A: Already created via Blueprint

If you used the Blueprint, the frontend service exists but needs `VITE_API_URL` set before it will work.

### Option B: Manual Static Site setup

1. Click **New +** → **Static Site**
2. Connect the same Git repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `validation-rule-manager-ui` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Add **Environment Variable**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://validation-rule-manager-api.onrender.com` |

> Replace with your actual backend URL from Part 3.  
> **Important:** `VITE_API_URL` is baked in at build time. If you change it later, you must **redeploy** the frontend.

5. Under **Redirects/Rewrites**, add:

| Source | Destination |
|--------|-------------|
| `/*` | `/index.html` |

(This is already configured in `render.yaml` and `frontend/public/_redirects`.)

6. Click **Create Static Site**
7. Wait for deploy to complete

### Copy your frontend URL

```
https://validation-rule-manager-ui.onrender.com
```

---

## Part 5 — Wire Everything Together

Now connect backend, frontend, and Salesforce.

### 1. Update backend environment variables

In the Render dashboard → **validation-rule-manager-api** → **Environment**:

| Key | Value |
|-----|-------|
| `SF_CALLBACK_URL` | `https://validation-rule-manager-api.onrender.com/auth/callback` |
| `FRONTEND_URL` | `https://validation-rule-manager-ui.onrender.com` |

Click **Save Changes** — Render will redeploy the backend automatically.

### 2. Update frontend environment variable (if not set)

In **validation-rule-manager-ui** → **Environment**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://validation-rule-manager-api.onrender.com` |

Save and **Manual Deploy** → **Deploy latest commit** to rebuild with the correct API URL.

### 3. Update Salesforce Connected App callback URL

In Salesforce → your Connected App → **OAuth Settings**:

1. Add callback URL:
   ```
   https://validation-rule-manager-api.onrender.com/auth/callback
   ```
2. You can keep `http://localhost:5000/auth/callback` for local dev
3. Save

---

## Part 6 — Test the Live App

1. Open your frontend URL: `https://validation-rule-manager-ui.onrender.com`
2. Click **Login with Salesforce**
3. You should be redirected to Salesforce login (not a 400 error)
4. After authorizing, you land on the **Dashboard**
5. Click **Fetch Validation Rules** — rules load from your org
6. Toggle a rule → **Deploy Changes** — verify it updates in Salesforce

---

## Environment Variables Reference

### Backend (`validation-rule-manager-api`)

| Variable | Required | Example |
|----------|----------|---------|
| `PORT` | Auto (Render) | `10000` |
| `NODE_ENV` | Yes | `production` |
| `SESSION_SECRET` | Yes | Auto-generated random string |
| `SF_LOGIN_URL` | Yes | `https://login.salesforce.com` |
| `SF_CLIENT_ID` | Yes | Salesforce Consumer Key |
| `SF_CLIENT_SECRET` | Yes | Salesforce Consumer Secret |
| `SF_CALLBACK_URL` | Yes | `https://your-api.onrender.com/auth/callback` |
| `FRONTEND_URL` | Yes | `https://your-ui.onrender.com` |

### Frontend (`validation-rule-manager-ui`)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_URL` | Yes | `https://your-api.onrender.com` |

---

## Free Tier Notes

| Topic | Detail |
|-------|--------|
| **Cold starts** | Free Web Services spin down after ~15 min of inactivity. First request may take 30–60 seconds. |
| **Always-on** | Upgrade to a paid plan ($7/mo) to avoid cold starts. |
| **Sessions** | Server-side sessions are in memory. If Render restarts the backend, users must log in again. |
| **HTTPS** | Render provides free SSL on `*.onrender.com` automatically. |

---

## Troubleshooting

### OAuth redirect fails / 400 Bad Request

- Confirm `SF_CALLBACK_URL` matches Salesforce Connected App **exactly**
- Confirm PKCE is handled (already built into this app)
- Check backend logs in Render → **Logs** tab

### Login works but API calls return 401

- Verify `FRONTEND_URL` on backend matches your frontend URL exactly (no trailing slash)
- Verify `VITE_API_URL` on frontend matches your backend URL
- Redeploy frontend after changing `VITE_API_URL`
- Check browser DevTools → Network → requests include cookies (`withCredentials`)

### CORS errors

- `FRONTEND_URL` must match the exact origin users visit (including `https://`)
- Redeploy backend after changing `FRONTEND_URL`

### React routes 404 on refresh

- Ensure SPA rewrite is configured: `/*` → `/index.html`
- Check `frontend/public/_redirects` is present

### Deploy fails on Render

- Check **Logs** for the failed service
- Confirm **Root Directory** is `backend` or `frontend` (not repo root)
- Confirm Node version ≥ 18

### Salesforce deploy errors

- Managed package validation rules cannot be updated via API
- Rules with "Top of Page" error display are handled automatically by this app

---

## Redeploying After Code Changes

```bash
git add .
git commit -m "Your change description"
git push origin main
```

Render auto-deploys on push if **Auto-Deploy** is enabled (default).

To redeploy manually: Render Dashboard → your service → **Manual Deploy** → **Deploy latest commit**.

---

## Custom Domains (Optional)

1. Render Dashboard → your service → **Settings** → **Custom Domains**
2. Add your domain and configure DNS per Render instructions
3. Update `FRONTEND_URL`, `SF_CALLBACK_URL`, `VITE_API_URL`, and Salesforce callback URL to use your custom domains
4. Redeploy both services

---

## Quick Checklist

- [ ] Code pushed to Git
- [ ] Backend deployed on Render
- [ ] `/health` endpoint returns success
- [ ] Frontend deployed on Render
- [ ] `VITE_API_URL` set to backend URL (frontend rebuilt)
- [ ] `SF_CALLBACK_URL` set on backend
- [ ] `FRONTEND_URL` set on backend
- [ ] Salesforce Connected App callback URL updated
- [ ] Login with Salesforce works
- [ ] Fetch / toggle / deploy works
