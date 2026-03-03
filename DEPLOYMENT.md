# 🚀 Pentexa Deployment Guide

Complete infrastructure setup for running Pentexa in production across **Vercel** (API), **Upstash** (Redis), and **Railway/Render** (Celery Worker).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │    Vercel (Serverless)  │
          │  api/index.py → FastAPI │
          │  • Auth, RBAC, Routes   │
          │  • Rate Limiting        │
          └──────┬────────┬────────┘
                 │        │
        ┌────────▼──┐  ┌──▼────────────────┐
        │  Neon /    │  │  Upstash Redis    │
        │  Supabase  │  │  (TLS / rediss://)│
        │ PostgreSQL │  │  • Token blacklist │
        └───────────┘  │  • Rate limiting   │
                       │  • Celery broker   │
                       └──────┬─────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Railway / Render   │
                    │  Celery Worker      │
                    │  • Scan tasks       │
                    │  • Background jobs  │
                    └────────────────────┘
```

---

## 1. PostgreSQL — Neon (Recommended)

### Setup
1. Sign up at [neon.tech](https://neon.tech)
2. Create a project → copy the connection string
3. The format will be: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname`

### Convert for asyncpg
Replace `postgresql://` with `postgresql+asyncpg://` in your env var:

```
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.region.aws.neon.tech/pentexa_db?sslmode=require
```

### Alternative: Supabase
- Same process at [supabase.com](https://supabase.com)
- Use the "Connection string" from Project Settings → Database

---

## 2. Redis — Upstash

### Setup
1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database (choose region closest to your Vercel deployment)
3. Copy the **TLS endpoint** — it uses `rediss://` (double s = TLS)

### Environment Variable
```
REDIS_URL=rediss://default:YOUR_PASSWORD@your-endpoint.upstash.io:6379
```

> **Note**: Upstash's free tier gives **10,000 commands/day** — sufficient for development and light production. Upgrade as needed.

### What Pentexa Uses Redis For
- **Token blacklisting** — Invalidated JWTs are stored with TTL
- **Login attempt tracking** — Brute-force protection (5 attempts → 15min lockout)
- **Celery message broker** — Task queue between Vercel and the worker

---

## 3. Celery Worker — Railway (Recommended)

Since Vercel is serverless and cannot run persistent processes, the Celery worker must run on a separate platform.

### Strategy: Same Codebase, Different Start Command

The Celery worker uses the **exact same code** as the Vercel deployment. The only difference is the start command:

| Platform | Start Command |
|---|---|
| **Vercel** | Automatic (reads `api/index.py`) |
| **Railway** | `celery -A app.worker.celery_app worker --loglevel=info` |

### Railway Setup

1. Sign up at [railway.app](https://railway.app)
2. Create a new project → **Deploy from GitHub repo** (same repo as Vercel)
3. Set the **Start Command**:
   ```
   celery -A app.worker.celery_app worker --loglevel=info --concurrency=2
   ```
4. Add the **same environment variables** as Vercel:
   ```
   DATABASE_URL=postgresql+asyncpg://...
   REDIS_URL=rediss://default:...@....upstash.io:6379
   SECRET_KEY=...
   REFRESH_SECRET_KEY=...
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
5. Railway will install from `requirements.txt` automatically

### Alternative: Render
1. Create a **Background Worker** service at [render.com](https://render.com)
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `celery -A app.worker.celery_app worker --loglevel=info`
4. Add the same environment variables

### How It Works

```
User clicks "Start Scan"
        │
        ▼
 Vercel (FastAPI) ──── POST /api/v1/scans/ ────▶ Creates ScanTask in PostgreSQL
        │                                         status = "PENDING"
        │
        └──── celery.send_task("dummy_scan_task") ──▶ Pushes to Upstash Redis
                                                            │
                                                            ▼
                                            Railway Celery Worker picks up task
                                                            │
                                                   Runs scan logic (15s)
                                                            │
                                                   Updates PostgreSQL
                                                   status = "SUCCESS"
                                                            │
        User polls GET /api/v1/scans/{id} ◀────────────── Done
```

---

## 4. Vercel Configuration

### Environment Variables (Dashboard)

Go to **Vercel → Project → Settings → Environment Variables** and add:

| Key | Example Value |
|---|---|
| `PROJECT_NAME` | `Pentexa Backend API` |
| `API_V1_STR` | `/api/v1` |
| `SECRET_KEY` | `(openssl rand -hex 64)` |
| `REFRESH_SECRET_KEY` | `(openssl rand -hex 64)` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` |
| `DATABASE_URL` | `postgresql+asyncpg://...` |
| `REDIS_URL` | `rediss://default:...@...upstash.io:6379` |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` |
| `RATE_LIMIT_PER_MINUTE` | `60` |
| `MAX_LOGIN_ATTEMPTS` | `5` |
| `LOGIN_LOCKOUT_MINUTES` | `15` |

### How vercel.json Works

- All requests are routed to `api/index.py`
- Python 3.11 runtime with 1024MB memory
- 60s max execution time (Hobby plan limit; Pro = 300s)
- Security headers automatically applied to all `/api/*` routes

---

## 5. Keeping Business Logic Identical

**Golden rule**: Both Vercel and the Celery worker share the same Git repository and the same `app/` package.

- **Vercel** reads from `api/index.py` → `app.main:app` → serves HTTP requests
- **Railway** reads from `app.worker.celery_app` → processes background tasks
- Both connect to the **same PostgreSQL** and **same Redis**
- Any code change pushed to GitHub is deployed to **both platforms simultaneously**

This means:
- ✅ No code duplication
- ✅ Models, schemas, and business logic are shared
- ✅ Database migrations apply to both (run `alembic upgrade head` from Railway or a one-off task)

---

## 6. First-Time Deployment Checklist

```
[ ] 1. Create Neon PostgreSQL → get DATABASE_URL
[ ] 2. Create Upstash Redis → get REDIS_URL
[ ] 3. Generate JWT secrets → openssl rand -hex 64 (×2)
[ ] 4. Push pentexa-deploy/ to GitHub
[ ] 5. Import repo in Vercel → set env vars → deploy
[ ] 6. Import same repo in Railway → set start command + env vars → deploy
[ ] 7. Test: GET https://your-project.vercel.app/ → should return health check
[ ] 8. Test: GET https://your-project.vercel.app/docs → Swagger UI
[ ] 9. Test: POST /api/v1/auth/register → create first user
[ ] 10. Test: POST /api/v1/scans/ → verify task queues to Railway worker
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| `ModuleNotFoundError` on Vercel | Check `requirements.txt` includes the missing package |
| Redis connection timeout | Verify `REDIS_URL` uses `rediss://` (TLS) for Upstash |
| DB connection refused | Ensure Neon project is active and `?sslmode=require` is in the URL |
| Celery tasks stuck in PENDING | Confirm Railway worker is running and shares the same `REDIS_URL` |
| Cold start slow (>10s) | Normal for first request; subsequent requests use warm lambda |
