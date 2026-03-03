# 🛡️ Pentexa Backend API — Production Build

> **Security-focused backend API** deployed on Vercel's serverless infrastructure.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | FastAPI 0.110 (Python 3.11) |
| **Database** | PostgreSQL via asyncpg + SQLAlchemy 2.0 |
| **Cache / Auth** | Redis (Upstash) — token blacklist, rate limit, brute-force protection |
| **Background Tasks** | Celery 5.3 (external worker on Railway/Render) |
| **Auth** | JWT (access + refresh tokens), RBAC with role-based permissions |
| **Hosting** | Vercel (serverless), External Celery Worker |

## Project Structure

```
pentexa-deploy/
├── api/
│   └── index.py          ← Vercel entry point (bridges to app.main:app)
├── app/
│   ├── main.py           ← FastAPI app with cold-start optimized lifespan
│   ├── api/              ← Route handlers (auth, scans)
│   ├── core/             ← Config, security, Redis, middleware
│   ├── db/               ← Session factory, seed data
│   ├── models/           ← SQLAlchemy ORM models
│   ├── schemas/          ← Pydantic request/response schemas
│   └── worker/           ← Celery app & task definitions
├── vercel.json           ← Vercel platform configuration
├── requirements.txt      ← Production-only dependencies
├── .env.example          ← Environment variable template
├── .gitignore            ← Git exclusion rules
└── DEPLOYMENT.md         ← Full infrastructure setup guide
```

## Quick Deploy

1. **Push to GitHub** — `git init && git add . && git commit -m "init" && git push`
2. **Import in Vercel** — Connect your GitHub repo at [vercel.com/new](https://vercel.com/new)
3. **Set Environment Variables** — Copy keys from `.env.example` into Vercel Dashboard
4. **Deploy** — Vercel auto-builds on push

## Environment Variables

See [`.env.example`](.env.example) for the full list. Required services:

- **PostgreSQL** — [Neon](https://neon.tech) or [Supabase](https://supabase.com)
- **Redis** — [Upstash](https://upstash.com) (use `rediss://` for TLS)
- **JWT Secrets** — Generate with `openssl rand -hex 64`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/docs` | Swagger UI |
| `POST` | `/api/v1/auth/register` | User registration |
| `POST` | `/api/v1/auth/login` | JWT login |
| `POST` | `/api/v1/auth/refresh` | Refresh token |
| `POST` | `/api/v1/auth/logout` | Token blacklist |
| `POST` | `/api/v1/scans/` | Start scan task |
| `GET` | `/api/v1/scans/{id}` | Get scan status |

## License

Private — All rights reserved.
