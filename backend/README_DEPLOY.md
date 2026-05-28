# AlgoTrader Pro - Backend Deployment Guide

This document outlines the steps, infrastructure requirements, and functional roadmap for deploying the AlgoTrader Pro backend.

## Repository Strategy: Monorepo
For this project, it is highly recommended to **stay with the current Monorepo structure** (where rontend, ackend, and ml folders all live in the same Git repository).

- **Why:** It allows you to manage the Frontend, Backend, and ML modules together. You can keep track of which ML model version is compatible with which Backend version in a single commit.
- **How to deploy:** Even though they are in one repo, you will deploy them to **separate services**. The backend will be hosted on a Python-compatible server, the frontend on a CDN/Serverless platform (like Vercel), and the ML module as a worker.

## Infrastructure Needs

To run the backend in a production environment, you will need the following components:

1.  **Database:** PostgreSQL. (Recommendation: Use a managed service like **Supabase** or **Neon** that supports syncpg compatibility).
2.  **Cache/Queue:** Redis. (Required for Celery background trading, task queues, and pricing cache).
3.  **Compute:** A hosting provider capable of running Python applications and background processes (e.g., Render, Railway, DigitalOcean App Platform, AWS EC2).

## Environment Variables
Create a production .env file in your hosting provider's dashboard.

\\\env
# App Configuration
APP_ENV=production
DEBUG=False
SECRET_KEY=your-super-secret-key-min-32-chars
ALLOWED_ORIGINS=["https://your-frontend-domain.com"]

# Database Connection
DATABASE_URL=postgresql+asyncpg://user:password@db-host:5432/db-name

# Redis Connection
REDIS_URL=redis://redis-host:6379/0

# Encryption (Crucial for User API Keys)
ENCRYPTION_KEY=your-fernet-encryption-key-base64

# Broker API (Default/Admin Keys for system tasks)
BINANCE_API_KEY=...
BINANCE_API_SECRET=...
BINANCE_TESTNET=False
\\\

## Deployment Steps (Production)

You will need to run three separate processes for the backend to function fully:

1.  **Backend API (The Web Server):**
    \\\ash
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    \\\
2.  **Celery Worker (The Trading Engine):**
    This process executes the actual trades in the background.
    \\\ash
    celery -A app.workers.celery_app worker --loglevel=info
    \\\
3.  **Celery Beat (The Scheduler):**
    This process schedules periodic tasks, such as the ML retraining pipeline.
    \\\ash
    celery -A app.workers.celery_app beat --loglevel=info
    \\\

### Docker Deployment (Alternative)
If you prefer containerization, you can use the provided docker-compose.yml:
\\\ash
docker-compose -f docker-compose.yml up --build -d
\\\
*Note: Make sure to run database migrations before starting the app:*
\\\ash
docker-compose exec backend alembic upgrade head
\\\

---

## Roadmap to "Fully Complete"

To make the platform ready for live users, the following functional gaps must be addressed in the codebase:

### 1. Secure API Key Management
*   **The Goal:** Allow users to add their own Binance/Alpaca keys.
*   **The Fix:** Implement symmetric encryption (Fernet) in core/security.py to encrypt keys before saving to the DB, and decrypt them when placing orders. Create the /api/v1/settings/apikeys endpoints.

### 2. User-Specific Broker Integration
*   **The Goal:** Trades should execute using the *user's* connected exchange account, not a global admin account.
*   **The Fix:** Update the execute_order_task in Celery to fetch and decrypt the user's specific ApiKey from the database before dispatching the order to Binance/Alpaca.

### 3. Live Risk Engine Updates
*   **The Goal:** The risk engine should validate trades against real data.
*   **The Fix:** Update isk/engine.py to fetch the user's actual portfolio balance from the broker API, replacing the hardcoded default 10000.0.

### 4. Machine Learning Auto-Retraining
*   **The Goal:** The system should automatically improve its predictions.
*   **The Fix:** Create a Celery task that triggers the ml/training/train.py script periodically (e.g., weekly), evaluates the new model, and hot-swaps the .pkl artifact if the accuracy improves.
