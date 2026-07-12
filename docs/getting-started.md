# Getting Started

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

## 1. Clone & install

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

## 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and set at minimum:

```dotenv
DB_PASSWORD=your_postgres_password
JWT_SECRET=a_random_string_at_least_64_chars_long
```

All other defaults work for a local setup.

## 3. Create the database and run migrations

```bash
# Create the database (run once)
createdb assetflow

# Run migrations — creates all tables and loads seed data
cd backend
npm run migrate
```

The migrate script is idempotent. It tracks executed files in a `_migrations` table, so re-running it is safe.

> **Note:** The booking overlap constraint requires the `btree_gist` PostgreSQL extension. The migration enables it automatically with `CREATE EXTENSION IF NOT EXISTS "btree_gist"`.

## 4. Start the servers

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Check the backend is healthy:

```bash
curl http://localhost:3001/health
# {"status":"ok","timestamp":"..."}
```

## 5. Log in

Open `http://localhost:5173`. Use any of the seeded demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | alex@assetflow.io | password123 |
| Asset Manager | jordan@assetflow.io | password123 |
| Department Head | sam@assetflow.io | password123 |
| Employee | taylor@assetflow.io | password123 |

> New signups are always assigned the **Employee** role. Promote users via Organization Setup → Employee Directory (Admin only).

## Frontend mock mode

The frontend currently runs against `src/data/mockData.js` — a local in-memory store. No backend connection is required to explore the UI. When you're ready to wire up the real API, replace the context calls in `AppDataContext.jsx` with `fetch`/axios calls to `http://localhost:3001/api/v1`.

## Environment variables reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Express listen port |
| `NODE_ENV` | `development` | `development` or `production` |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `assetflow` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | — | Database password |
| `DB_SSL` | `false` | Set `true` for hosted DBs (e.g. Supabase) |
| `JWT_SECRET` | — | Signing secret — keep private |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allowed origin |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost factor |
