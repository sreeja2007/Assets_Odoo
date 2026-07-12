# AssetFlow

Enterprise Asset & Resource Management System — built with React, Node.js, and PostgreSQL.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, React Router, Tailwind CSS 4, Lucide Icons |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (pg) |
| Auth | JWT + bcrypt |

## Project Structure

```
├── frontend/          # React SPA
│   ├── src/
│   │   ├── context/   # AuthContext, AppDataContext
│   │   ├── components/
│   │   │   ├── common/    # Button, Card, Input, Modal, StatusPill, Toast
│   │   │   └── layout/    # AppLayout, Sidebar
│   │   ├── data/      # mockData.js (swap for API calls later)
│   │   └── pages/     # One file per screen
└── backend/
    ├── migrations/    # 001_initial_schema.sql, 002_seed.sql
    └── src/
        ├── config/    # db.js, migrate.js
        ├── controllers/
        ├── middleware/ # auth, errorHandler, validate
        ├── models/    # activityLog, notification
        └── routes/
```

## Getting Started

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Backend
```bash
# 1. Create the database
createdb assetflow

# 2. Install dependencies
cd backend
npm install

# 3. Copy and configure env
cp .env.example .env   # edit DB_PASSWORD and JWT_SECRET

# 4. Run migrations + seed data
npm run migrate

# 5. Start dev server
npm run dev            # http://localhost:3001
```

## API Base URL

```
http://localhost:3001/api/v1
```
