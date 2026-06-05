# Deploy to Render (Single Service — Recommended)

Use **one Render Web Service** that serves both the React UI and the Express API on the same URL. This fixes:

- `/login` and `/dashboard` returning **404 Not Found**
- OAuth `redirect_uri_mismatch` from mismatched frontend/backend URLs
- Session/cookie issues between two different Render domains

Your app URL will look like:

```
https://salesforce-validation-rule-manager-xxxx.onrender.com
```

---

## Step 1 — Push latest code to Git

```bash
git add .
git commit -m "Single-service Render deploy"
git push
```

---

## Step 2 — Create ONE Web Service on Render

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. **New +** → **Web Service** (not Static Site)
3. Connect your Git repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `salesforce-validation-rule-manager` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm run build:render` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/health` |

> **Important:** Root Directory must be `backend` (not empty, not `frontend`).

Alternative: if Root Directory is **empty** (repo root), use Build Command `npm run build:render` and Start Command `npm start` from the root `package.json` instead.

---

## Step 3 — Environment variables

Replace `YOUR-RENDER-URL` with your actual Render URL after the first deploy, or use the name you chose:

```
https://salesforce-validation-rule-manager-1-3m5q.onrender.com
```

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | Generate a random string |
| `SF_LOGIN_URL` | `https://login.salesforce.com` |
| `SF_CLIENT_ID` | Your Salesforce Consumer Key |
| `SF_CLIENT_SECRET` | Your Salesforce Consumer Secret |
| `SF_CALLBACK_URL` | `https://YOUR-RENDER-URL.onrender.com/auth/callback` |
| `FRONTEND_URL` | `https://YOUR-RENDER-URL.onrender.com` |
| `VITE_API_URL` | *(leave empty)* |

**All three URLs must use the same Render service hostname.**

Do **not** set `PORT` — Render sets it automatically.

---

## Step 4 — Update Salesforce Connected App

In Salesforce → **Setup** → **App Manager** → your Connected App → **Edit**:

Add this **exact** callback URL:

```
https://YOUR-RENDER-URL.onrender.com/auth/callback
```

Example:

```
https://salesforce-validation-rule-manager-1-3m5q.onrender.com/auth/callback
```

Save and wait 2–5 minutes.

---

## Step 5 — Redeploy and test

1. Save environment variables on Render → service redeploys
2. Open `https://YOUR-RENDER-URL.onrender.com` (not `/dashboard` first — start at root)
3. Click **Login with Salesforce**
4. After login you should land on `/dashboard`
5. Test **Fetch Validation Rules** → toggle → **Deploy Changes**

Verify health check:

```
https://YOUR-RENDER-URL.onrender.com/health
```

Should return `"servesFrontend": true`

---

## If you already have TWO Render services

You likely have a **backend Web Service** and a **frontend Static Site** that are misconfigured. Recommended fix:

1. **Delete** or ignore the separate frontend Static Site
2. Create **one** Web Service using the settings above (repo root, `npm run build:render`)
3. Use only that one URL everywhere

---

## Troubleshooting

### `/login` or `/dashboard` shows Not Found

| Cause | Fix |
|-------|-----|
| Using backend-only deploy (`rootDir: backend`) | Use repo root + `npm run build:render` |
| Using Static Site for React | Use **Web Service** instead |
| Old deploy without SPA support | Push latest code and redeploy |

### `redirect_uri_mismatch`

| Cause | Fix |
|-------|-----|
| Salesforce callback URL not added | Add exact `https://YOUR-URL.onrender.com/auth/callback` |
| `SF_CALLBACK_URL` wrong in Render | Must match Salesforce exactly |
| Trailing slash | Remove trailing `/` from callback URL |

### Login works locally but not on Render

| Cause | Fix |
|-------|-----|
| Sandbox org | Set `SF_LOGIN_URL` to `https://test.salesforce.com` |
| Wrong Client ID | Must match the Connected App where callback URL was added |

### `servesFrontend: false` in `/health`

The React build was not copied to `backend/public`. Check Render build logs for errors in `npm run build:render`.

---

## Optional: Blueprint one-click deploy

This repo includes `render.yaml`. Use **New + → Blueprint** and connect your repo. Set `SF_CLIENT_ID`, `SF_CLIENT_SECRET`, `SF_CALLBACK_URL`, and `FRONTEND_URL` when prompted.

---

## Checklist

- [ ] One Web Service (repo root, not `backend/` only)
- [ ] Build: `npm run build:render`
- [ ] Start: `npm start`
- [ ] `SF_CALLBACK_URL` = `https://YOUR-URL.onrender.com/auth/callback`
- [ ] `FRONTEND_URL` = `https://YOUR-URL.onrender.com`
- [ ] Same URL added in Salesforce Connected App
- [ ] `/health` shows `"servesFrontend": true`
- [ ] App opens at root URL, login works, dashboard loads
