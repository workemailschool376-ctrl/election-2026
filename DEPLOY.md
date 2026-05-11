# 🚀 Deploying Election 2026 — Free with Render + Turso

**Total cost: $0/month**  
**Your Turso database is already set up and seeded ✅**

---

## Architecture

```
GitHub (code) ──push──▶ Render (builds & hosts Next.js) ──reads/writes──▶ Turso (cloud SQLite)
                                                                               ↑
                                                              Candidate symbols stored here forever
```

---

## What You Need

- [ ] A **GitHub account** → [github.com](https://github.com)
- [ ] A **Render account** → [render.com](https://render.com) (sign up free with GitHub)
- [x] Turso database — **already done!**

---

## Part 1 — Push Code to GitHub

### Step 1: Create a GitHub repository
- Go to [github.com/new](https://github.com/new)
- Repository name: `election-2026`
- Set to **Private** (recommended for a school app)
- Click **Create repository**

### Step 2: Push your code
Run in PowerShell from your project folder:

```powershell
git add .
git commit -m "Deploy: Turso + Render setup"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/election-2026.git
git push -u origin main
```

> If `git remote add` fails because remote already exists, run:
> `git remote set-url origin https://github.com/YOUR-USERNAME/election-2026.git`

---

## Part 2 — Deploy on Render

### Step 1: Create a new Web Service
- Go to [dashboard.render.com](https://dashboard.render.com)
- Click **New → Web Service**
- Connect your GitHub account if not already done
- Select your `election-2026` repository

### Step 2: Configure the service

| Setting | Value |
|---|---|
| **Name** | `election-2026` |
| **Region** | Singapore (closest to Nepal) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

### Step 3: Add Environment Variables
Click **"Environment"** tab and add these 3 variables:

| Key | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://election-2026-workemailschool376-ctrl.aws-ap-south-1.turso.io` |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Nzg1MjAxNjIsImlkIjoiMDE5ZTE4MGYtNDMwMS03MmNkLWFhZmQtNWE4ODMyNjlhMTI5IiwicmlkIjoiMzRjMDdlZmUtYmRjZi00NjM3LWI3MGEtMDg3NjczYmRiMTQ0In0.t3-SdbzH_GXz27IHi1vL47660WBFBapB4J8Aeqd8XxEM1A-8OTf8RrFX0hWOpt4LkK9QzwR7BLkJqx6S9x-aBA` |
| `ADMIN_PASSWORD` | `your-chosen-admin-password` |

### Step 4: Deploy
- Click **"Create Web Service"**
- Render builds your app (~3-5 minutes)
- You get a free URL: `https://election-2026.onrender.com`

---

## Part 3 — After Deployment

### Your app is live ✅
- **Dashboard**: `https://election-2026.onrender.com`
- **Admin panel**: `https://election-2026.onrender.com/admin`

### Uploading candidate symbols/logos
1. Go to your Admin panel
2. Log in with your `ADMIN_PASSWORD`
3. Upload candidate symbols — stored as binary in Turso
4. **They survive forever** — Turso keeps them permanently across all redeployments

### ⚠️ Render Free Tier: Cold Starts
Render's free tier **spins down** after 15 minutes of inactivity.
The first request after that takes ~30 seconds to wake up.
Once awake, it runs normally. This is fine for a school election event.

### Future code updates
Every push to GitHub → Render automatically rebuilds and redeploys.
Your Turso data is **never touched** during redeployment.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails | Check that `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set in Render env vars |
| "Application error" on live site | Go to Render dashboard → Logs → check for error message |
| Admin login not working | Check `ADMIN_PASSWORD` env var in Render |
| Candidate images not showing | Turso auth token might be wrong — double-check `TURSO_AUTH_TOKEN` |
| Site takes 30s to load | Normal — Render free tier cold start. Refresh and it will be fast |

---

## Cost Summary

| Service | Free Limits | Your Usage |
|---|---|---|
| Render Web Service | 750 hrs/month, spins down after inactivity | ✅ Fine for school events |
| Turso Database | 500 MB, 1B reads/month | ✅ Tiny — school election data |
| **Total** | | **$0/month** |
