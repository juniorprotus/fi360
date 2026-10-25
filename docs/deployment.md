# Render & Vercel Deployment Guide

## 1. Deploy Backend to Render

### A. Create the Web Service
1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select the `juniorprotus/fi360` repository
4. Render will auto-detect the `backend/render.yaml` settings

### B. Configure Build & Deploy
| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |
| **Environment** | `Node` |
| **Instance Type** | Free |

The build compiles TypeScript to CommonJS in `backend/dist`; all compiler-required type declarations are regular dependencies so the build also works when Render installs with `NODE_ENV=production`. `npm start` runs the generated `dist/server.js` entry point.

### C. Set Environment Variables
In Render → Service → **Environment** tab, add:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | your Atlas connection string |
| `JWT_SECRET` | A unique, cryptographically random secret stored as a Render secret environment variable (at least 16 characters; do not use the development default) |
| `FRONTEND_URL` | The exact HTTPS origin of the production Vercel frontend (for example, `https://fleet.example.com`) |
| `GEMINI_API_KEY` | your Gemini key (Phase 4) |

The service intentionally refuses to start in production unless `MONGODB_URI`, a secure `JWT_SECRET`, and the exact HTTPS `FRONTEND_URL` origin are configured. Do not put secret values in `render.yaml` or source control. Vercel preview URLs are not trusted; configure a separate explicit origin only if the deployment design is approved.

Cookie-authenticated state-changing requests require the configured frontend `Origin` and the `X-FI360-Request: 1` header. The frontend client sets this header automatically. The production cookie remains `SameSite=None; Secure` for the cross-site Vercel/Render topology; actual browser cookie acceptance and blocking behavior must still be verified on the deployed domains.

`/api/health` is the database readiness endpoint used by Render and returns HTTP 503 when MongoDB is unavailable. `/api/live` reports HTTP-process liveness without implying database readiness.

### D. Get Your Render URL
After deploying, Render assigns a URL like:
`https://fi360-backend.onrender.com`

**Test it:** `curl https://fi360.onrender.com/api/health`

---

### E. Set Up Anti-Hibernation Cron Job (Critical!)
Render free tier sleeps after 15 minutes of inactivity. Fix it with a free cron:

1. Go to [cron-job.org](https://cron-job.org) and create a free account
2. Create a new cron job:
   - **URL:** `https://fi360.onrender.com/api/health`
   - **Schedule:** Every **14 minutes** (`*/14 * * * *`)
   - **HTTP Method:** `GET`
3. Save — your backend now stays live 24/7 🟢

---

## 2. Deploy Frontend to Vercel

### A. Create the Project
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New"** → **"Project"**
3. Import **`juniorprotus/fi360`** from GitHub
4. Set **Root Directory** to `frontend`

### B. Configure Environment Variables
In Vercel → Project → **Settings** → **Environment Variables**:

| Key | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://fi360-backend.onrender.com` | Production |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Preview, Development |

### C. Deploy
Click **"Deploy"** — Vercel auto-deploys on every push to `main`.

Your frontend will be live at: `https://fi360-<hash>.vercel.app`

### D. Update FRONTEND_URL on Render
Once you have your Vercel URL, go back to Render and update the `FRONTEND_URL` environment variable.

---

## 3. Verify Full Stack is Live

```bash
# 1. Backend health
curl https://fi360.onrender.com/api/health

# 2. Vehicles API (uses Atlas data after seeding)
curl https://fi360.onrender.com/api/vehicles

# 3. Fleet metrics
curl https://fi360.onrender.com/api/vehicles/metrics
```
