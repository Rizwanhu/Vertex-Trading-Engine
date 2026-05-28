# Running Guide — Full Local Setup

This guide explains how to run the **complete** Vertex Trading Engine on your machine: every service, the frontend, and how to confirm everything is working. Configuration lives in `.env` — you should not need to change code to run locally.

---

## What runs in a full stack

| # | Service | Purpose | Port / URL |
|---|---------|---------|------------|
| 1 | **PostgreSQL** (TimescaleDB) | Users, orders, bots, strategies | `localhost:5432` |
| 2 | **Redis** | Celery queue + live price cache | `localhost:6379` |
| 3 | **FastAPI backend** | REST API + Binance WS → Redis | `http://localhost:8000` |
| 4 | **Celery worker** | Executes orders, bot ticks, price jobs | (no HTTP port) |
| 5 | **Celery beat** | Schedules periodic tasks (prices, candles, bots) | (no HTTP port) |
| 6 | **Next.js frontend** | Dashboard UI | `http://localhost:3000` |

Optional (not required for the dashboard):

| Service | Folder | Notes |
|---------|--------|-------|
| ML training | `ml/training/` | Offline model training |
| ML inference | `ml/inference/` | Used by ML strategy in backend |

---

## Prerequisites

Install **one** of these setups:

**Recommended (easiest):** [Docker Desktop](https://www.docker.com/products/docker-desktop/) — runs Postgres + Redis (or the entire stack).

**Fully manual:** Python 3.11+, Node.js 18+, PostgreSQL 15, Redis 7 installed on Windows.

---

## Environment files (`.env`)

The project uses two `.env` files. Keep secrets only in these files — never commit them.

### Root `.env` (project folder)

Used by **Docker Compose** for all containers. Hostnames must be Docker service names:

```env
# Database — Docker service name "postgres"
DATABASE_URL=postgresql+asyncpg://trader:password@postgres:5432/algotrader
DATABASE_SYNC_URL=postgresql+psycopg2://trader:password@postgres:5432/algotrader

# Redis — Docker service name "redis"
REDIS_URL=redis://redis:6379/0

# Auth
SECRET_KEY=your-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Brokers (testnet / paper recommended)
BINANCE_API_KEY=...
BINANCE_API_SECRET=...
BINANCE_TESTNET=true

ALPACA_API_KEY=...
ALPACA_API_SECRET=...
ALPACA_BASE_URL=https://paper-api.alpaca.markets

# Frontend (read by Next.js in Docker)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### `backend/.env`

Used when you run the **API and Celery from your terminal** (not inside Docker). Hostnames must be `localhost`:

```env
DATABASE_URL=postgresql+asyncpg://trader:password@localhost:5432/algotrader
DATABASE_SYNC_URL=postgresql+psycopg2://trader:password@localhost:5432/algotrader
REDIS_URL=redis://localhost:6379/0

SECRET_KEY=your-long-random-secret
BINANCE_API_KEY=...
BINANCE_API_SECRET=...
BINANCE_TESTNET=true
# ... same broker / auth vars as root .env
```

### Frontend env (local `npm run dev` only)

Create `frontend/.env.local` (or rely on defaults in `next.config.js`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

> **Rule of thumb:** Docker stack → root `.env` with `postgres` / `redis` hosts. Native backend → `backend/.env` with `localhost`. Frontend always talks to `http://localhost:8000` from your browser.

---

## Option A — Run everything with Docker (one command)

From the project root (`algo trade`):

```powershell
cd "C:\Users\FURQAN\Desktop\algo trade"
docker compose up --build
```

Wait until containers are healthy, then open:

| What | URL |
|------|-----|
| Dashboard | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

Stop everything: `Ctrl+C`, or `docker compose down`.

**First-time note:** Tables are created automatically when the backend starts (`main.py` lifespan). No separate migration step is required unless you add Alembic later.

---

## Option B — Run each service separately (local dev)

Best when you want separate terminals, breakpoints, and hot reload. You still use `.env` for all secrets and connection strings.

### Step 0 — Open the project root

```powershell
cd "C:\Users\FURQAN\Desktop\algo trade"
```

### Step 1 — Start infrastructure (Postgres + Redis)

**Easiest:** run only DB + Redis in Docker, app code on your machine:

```powershell
docker compose up postgres redis -d
```

Confirm they are up:

```powershell
docker compose ps
```

Defaults (match `docker-compose.yml`):

- Postgres: user `trader`, password `password`, database `algotrader`, port `5432`
- Redis: port `6379`

**Alternative:** use locally installed PostgreSQL and Redis on the same ports and credentials as in `backend/.env`.

---

### Step 2 — Backend API (Terminal 1)

```powershell
cd backend

python -m venv venv
.\venv\Scripts\activate

pip install -r requirements.txt

# Loads backend/.env automatically
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see Uvicorn running on port 8000. On startup the API also starts the Binance WebSocket → Redis price feed.

**Verify:**

```powershell
curl http://localhost:8000/health
```

Expected:

```json
{"status":"ok","app":"AlgoTrader Pro"}
```

Also open http://localhost:8000/docs in the browser.

---

### Step 3 — Celery worker (Terminal 2)

Required for **order execution** and **bot tasks**. Without it, orders stay `PENDING`.

```powershell
cd backend
.\venv\Scripts\activate

celery -A app.workers.celery_app worker --loglevel=info --pool=solo -c 1
```

> **Windows:** You must use `--pool=solo -c 1`. The default `prefork` pool causes `PermissionError` / `WinError 6` on shutdown and is unreliable on Windows.

You should see `celery@... ready` and registered tasks (`execute_order`, `run_bot_tick`, etc.).

---

### Step 4 — Celery beat (Terminal 3)

Required for **scheduled** jobs (price cache every 2s, candles every minute, bot ticks when bots are started).

```powershell
cd backend
.\venv\Scripts\activate

celery -A app.workers.celery_app beat --loglevel=info
```

Keep this terminal open while bots or scheduled market jobs should run.

---

### Step 5 — Frontend (Terminal 4)

```powershell
cd frontend

npm install
npm run dev
```

Open http://localhost:3000

The UI calls the API at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) and live prices at `ws://localhost:8000/api/ws/prices`.

---

### Quick reference — all local terminals

| Terminal | Directory | Command |
|----------|-------------|---------|
| Infra | project root | `docker compose up postgres redis -d` |
| 1 — API | `backend` | `.\venv\Scripts\activate` → `uvicorn main:app --reload --host 0.0.0.0 --port 8000` |
| 2 — Worker | `backend` | `.\venv\Scripts\activate` → `celery -A app.workers.celery_app worker --loglevel=info --pool=solo -c 1` |
| 3 — Beat | `backend` | `.\venv\Scripts\activate` → `celery -A app.workers.celery_app beat --loglevel=info` |
| 4 — UI | `frontend` | `npm run dev` |

Minimum for **browsing + login + charts (REST)**:** infra + API + frontend.

Minimum for **placing orders and bots:** infra + API + worker (+ beat for scheduled bots).

---

## Verify the full system is working

### 1. Backend health

- http://localhost:8000/health → `{"status":"ok",...}`

### 2. API docs

- http://localhost:8000/docs — try `POST /api/auth/register` and `POST /api/auth/login`

### 3. Frontend auth flow

1. Go to http://localhost:3000 → redirects to login.
2. **Register** with email + password (calls `POST /api/auth/register`).
3. **Login** → you should land on `/dashboard`.
4. Open DevTools → **Network**: requests go to `http://localhost:8000/api/...` with `Authorization: Bearer ...`.

### 4. Live prices (WebSocket)

1. Stay on the dashboard with API running.
2. DevTools → **Network** → **WS** — connection to `ws://localhost:8000/api/ws/prices`.
3. BTC (or selected symbol) price on the dashboard should update when ticks arrive (requires Redis + backend WS task; Binance keys help but public stream may still run).

### 5. Manual trade (needs Celery worker)

1. Go to **Trade** in the sidebar.
2. Place a small **market** order (use testnet / paper keys in `.env`).
3. Worker terminal should log task execution; order status should move from `PENDING` toward `FILLED` (or show broker error in API response/logs).

### 6. Portfolio & bots

- **Portfolio** page: balance / P&L from `/api/portfolio/...`
- **Bots** page: create strategy → create bot → **Start** (beat + worker must be running)

### 7. Backend tests (optional)

```powershell
cd backend
.\venv\Scripts\activate
pytest
```

---

## Service map (how pieces connect)

```text
Browser (localhost:3000)
    │  REST  →  NEXT_PUBLIC_API_URL  (localhost:8000)
    │  WS    →  NEXT_PUBLIC_WS_URL/api/ws/prices
    ▼
FastAPI (main.py)
    ├── PostgreSQL  (DATABASE_URL)
    ├── Redis       (REDIS_URL)
    └── Binance WS  → Redis pub/sub "live_prices"
    ▼
Celery worker  ←── Redis broker
Celery beat    ←── schedules tasks
    ▼
Broker APIs (Binance testnet / Alpaca paper per .env)
```

---

## API routes the frontend uses

| Area | Base path |
|------|-----------|
| Auth | `/api/auth/register`, `/login`, `/refresh`, `/logout` |
| Orders | `/api/orders/` |
| Portfolio | `/api/portfolio/balance`, `/pnl`, `/equity-curve` |
| Bots | `/api/bots/` |
| Strategies | `/api/strategies/` |
| Market | `/api/market/candles/{symbol}`, `/price/{symbol}` |
| WebSocket | `ws://localhost:8000/api/ws/prices` |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Connection refused` on 5432 / 6379 | Start `docker compose up postgres redis -d` or local Postgres/Redis |
| API starts but login fails | Check `DATABASE_URL` in `backend/.env` uses `localhost`, not `postgres` |
| Celery errors connecting to Redis | `REDIS_URL=redis://localhost:6379/0` in `backend/.env` |
| Orders stuck on PENDING | Start **Celery worker** (Terminal 2) |
| Celery `PermissionError` / `WinError 6` on Windows | Use `--pool=solo -c 1` on the worker command |
| Redis `getaddrinfo failed` (Upstash) | Wait/retry, or use local Redis: `docker compose up redis -d` and `REDIS_URL=redis://localhost:6379/0` |
| `Invalid SSL Certificate Requirements Flag: CERT_NONE` | Remove `?ssl_cert_reqs=CERT_NONE` from `REDIS_URL` in `.env` (SSL is set in `app/core/redis.py`) |
| Bots never tick | Start **Celery beat** (Terminal 3) and start the bot from the UI |
| Frontend can't reach API | Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `frontend/.env.local`, restart `npm run dev` |
| CORS errors | Add `http://localhost:3000` to `ALLOWED_ORIGINS` in `.env` |
| Port 3000 or 8000 in use | Stop other apps or change port: `uvicorn ... --port 8001`, `npm run dev -- -p 3001` (and update `NEXT_PUBLIC_*` URLs) |
| Binance / broker errors | Confirm keys in `.env`, `BINANCE_TESTNET=true` for testnet, restart API + worker |

---

## Production / deploy (short)

Three backend processes:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
celery -A app.workers.celery_app worker --loglevel=info --pool=solo -c 1   # Windows
celery -A app.workers.celery_app beat --loglevel=info
```

Frontend: `cd frontend && npm run build && npm start` (or deploy to Vercel with the same `NEXT_PUBLIC_*` env vars pointing at your API URL).

See `backend/README_DEPLOY.md` for hosting notes.
