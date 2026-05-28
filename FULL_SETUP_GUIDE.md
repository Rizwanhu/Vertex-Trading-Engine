# 🚀 Full Project Setup & Execution Guide

This guide provides step-by-step instructions to get the **AlgoTrader Pro** system up and running on your local machine. It covers both manual setup and Docker-based execution.

---

## 📋 Prerequisites
Before you begin, ensure you have the following installed:
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop/) (Recommended)
- [Git](https://git-scm.com/)

---

## 🛠️ Method 1: Running with Docker (Recommended)
This is the fastest way to get everything (Backend, Frontend, Database, Redis) running together.

### 1. Configure Environment
Create a `.env` file in the **root directory** (same folder as `docker-compose.yml`) and add:
```env
DATABASE_URL=postgresql+asyncpg://trader:password@postgres:5432/algotrader
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your_secret_key_here
BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret
```

### 2. Launch the System
Open your terminal in the root directory and run:
```bash
docker-compose up --build
```
*Wait for the containers to build and start. Once finished, you can access:*
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ Method 2: Manual Setup (Development Mode)
Use this if you want to run components separately for debugging.

### Phase 1: Infrastructure
You must have **PostgreSQL** and **Redis** running.
- **PostgreSQL:** Port 5432 (DB: `algotrader`, User: `trader`, Pass: `password`)
- **Redis:** Port 6379

### Phase 2: Backend Setup
1. **Navigate to backend:**
   ```bash
   cd backend
   ```
2. **Create and Activate Virtual Environment:**
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```
3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure .env:**
   Create `backend/.env` with your local database and API keys.
5. **Run the API:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
6. **Run Celery Worker (In a NEW terminal, with venv active):**
   ```bash
   celery -A app.workers.celery_app worker --loglevel=info
   ```

### Phase 3: Frontend Setup
1. **Navigate to frontend (New terminal):**
   ```bash
   cd frontend
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Run Development Server:**
   ```bash
   npm run dev
   ```
   *Access at [http://localhost:3000](http://localhost:3000)*

---

## 🧪 Testing & Verification

### 1. Verify Backend Health
Open [http://localhost:8000/health](http://localhost:8000/health). You should see:
```json
{"status": "ok", "app": "AlgoTrader Pro"}
```

### 2. Run Backend Unit Tests
```bash
cd backend
# Ensure venv is active
pytest
```

### 3. Check WebSocket Connectivity
Check the browser console in the frontend (`localhost:3000`) to ensure it's connecting to `ws://localhost:8000/api/ws`.

---

## 🆘 Troubleshooting
- **Database Connection Error:** Ensure Postgres is running and the `DATABASE_URL` matches your credentials.
- **Redis Connection Error:** Celery requires Redis. Ensure the Redis service is active.
- **Port Conflict:** If 3000 or 8000 is taken, use the `--port` flag to change it.
- **Docker Permissions:** On Linux, you might need to run docker commands with `sudo`.

---

## 📦 Project Structure Overview
- `/backend`: FastAPI, SQLAlchemy, Celery, Trading Logic.
- `/frontend`: Next.js, TailwindCSS, Dashboard UI.
- `/ml`: Machine learning models and training scripts.
- `docker-compose.yml`: Orchestration for all services.
