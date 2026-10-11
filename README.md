# Daryapak (دریاپاک) — Online Seafood Ordering Platform

## Overview
A full-stack seafood ordering platform with Persian RTL UI, customer accounts, cart, order tracking (without online payment), and a complete admin panel.

## Tech Stack
- **Frontend:** React 18 + Vite + React Router, custom CSS design system, Vazirmatn font, RTL
- **Backend:** Node.js + Express (ES Modules), JWT auth, bcrypt password hashing
- **Database:** PostgreSQL 16

## Architecture
```
backend/
  src/
    config/env.js        — environment config
    db/pool.js           — PostgreSQL connection pool
    migrations/          — SQL migration files (run automatically on startup)
    middleware/          — auth (JWT), error handling
    routes/              — Express route handlers (auth, products, categories, cart, orders, addresses, settings, admin)
    seed.js              — dev seed data (admin user, categories, products, settings)
    index.js             — Express app entry point
frontend/
  src/
    api/client.js        — fetch-based API client
    context/             — Auth, Cart, Toast contexts
    components/          — Header, Footer, ProductCard, StatusBadge, OrderTimeline, DashLayout, etc.
    pages/               — public pages, account/ pages, admin/ pages
    styles/global.css    — complete design system (ocean theme, RTL, responsive)
    utils/status.js      — status labels, price/date formatters (Persian)
```

## Running with Docker Compose
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- PostgreSQL: internal (port 5432)

## Deploying on Vercel (single service)

The repo deploys as one: the Vite build is served statically and the whole
Express API runs as the `api/index.js` serverless function — same origin, so
no CORS or cookie configuration is needed (auth uses Bearer tokens).

* Root `package.json` declares npm workspaces (`backend`, `frontend`).
* `vercel.json` publishes `frontend/dist` and rewrites `/api/*` to the function.
* The first request auto-applies migrations and seeds the catalogue + admin
  account when the database is fresh (`backend/src/db/init.js`).
* No manual `DATABASE_URL` is needed with Vercel Postgres (`Storage → Create
  Database` injects `POSTGRES_URL` automatically). `JWT_SECRET` is optional
  (without it an ephemeral secret is generated and logins reset on restart).

Steps: connect repo → create Postgres database → Deploy.

## Admin Access (dev seed)
- Email: admin@daryapak.ir
- Password: admin123456

## Key Features
- Customer registration/login with JWT
- Product browsing with search, filter, sort, pagination
- Product detail with quantity selector
- Cart with server-side price calculation
- Order checkout without online payment
- Order status timeline (pending → confirmed → preparing → shipped → delivered)
- Customer panel: dashboard, orders, addresses, profile
- Admin panel: dashboard, products, categories, orders, customers, inventory, settings
- Server-side authorization (customers can only see their own orders)
- Inventory management with movement history
- Configurable site settings (brand name, contact, shipping, etc.)
- RTL Persian UI with Vazirmatn font
- Responsive (mobile, tablet, desktop)
