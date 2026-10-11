# AGENTS.md — Daryapak (دریاپاک)

## Project Type
Full-stack seafood ordering platform. React + Vite frontend, Node.js + Express backend, PostgreSQL database. Persian RTL UI.

## Quick Start
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
Frontend on http://localhost:3000, backend API on http://localhost:4000/api (internal, proxied via Vite).

## Admin Credentials (dev seed)
- Email: `admin@daryapak.ir`
- Password: `admin123456`

## Architecture Notes
- **Monorepo**: `backend/` and `frontend/` directories, each with own Dockerfile and package.json.
- **Backend**: ES Modules (`"type": "module"`), Express, JWT auth (7-day expiry), bcrypt password hashing.
- **Migrations**: Auto-run on backend startup via `src/migrate.js` (reads `src/migrations/*.sql`, tracks in `_migrations` table).
- **Seeds**: Auto-run on first startup in dev mode if no admin user exists (`src/seed.js`). Creates admin, 7 categories, 14 products, and site settings.
- **Frontend**: Vite 5.4 dev server with `/api` proxy to backend. `allowedHosts: true` gated on `BASE44_PREVIEW_MODE === '1'` (Vite 5.4.12+ DNS rebinding fix blocks unknown Host headers).
- **Single origin**: Frontend proxies API calls to backend via Vite, avoiding CORS issues. No separate API port exposed to host.

## Key Design Decisions
- No online payment — orders are placed without payment, settled on delivery.
- Order status flow: `pending_review → confirmed → preparing → ready_to_ship → shipped → delivered`. Terminal states: `rejected`, `cancelled`, `needs_contact`.
- Server-side price recalculation on checkout (client prices never trusted).
- Order items snapshot product name/price/unit at order time (price changes don't affect past orders).
- Stock decremented atomically in a DB transaction on order creation.
- Soft-delete products that appear in past orders; hard-delete only if never ordered.
- Customers can only access their own orders/addresses (enforced in backend, not just UI).

## Environment Variables
All local — no external secrets needed:
- `DATABASE_URL`: PostgreSQL connection string (set in compose)
- `JWT_SECRET`: JWT signing secret (set in compose)
- `PORT`: Backend port (4000)
- `VITE_API_TARGET`: Backend URL for Vite proxy (http://backend:4000)
- `BASE44_PREVIEW_MODE`: Platform flag, gates `allowedHosts` in Vite config

## Verifying the App
1. `curl http://localhost:3000` — should return HTML with `lang="fa" dir="rtl"`
2. `curl http://localhost:3000/api/health` — should return `{"ok":true}`
3. `curl http://localhost:3000/api/products?limit=2` — should return product JSON
4. Login at `/login` with admin credentials, navigate to `/admin` dashboard.
5. Browse products at `/products`, add to cart, checkout flow at `/checkout`.
