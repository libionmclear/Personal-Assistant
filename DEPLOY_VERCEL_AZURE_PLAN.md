# HEGEMON Deployment Plan: Vercel now, Azure backend later

## Phase 1: Go live now on Vercel

This repo is configured so Vercel serves the game prototype immediately:

- `/` routes to `game.html`
- `build:web` runs during deploy to generate `web/engine.bundle.js`
- Existing `api/*.js` functions stay deployable on Node 20

### One-time Vercel project setup

1. Import this GitHub repo into Vercel.
2. Framework preset: `Other`.
3. Root directory: repo root.
4. Build command: leave blank (uses `vercel.json`) or set `npm run build:web`.
5. Output directory: leave blank.
6. Deploy.

### Local preflight

```bash
npm install
npm run typecheck
npm run test:game:ts
npm run build:web
```

### Production deploy via CLI (optional)

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

## Current routes

- `/` -> game prototype (`game.html`)
- `/index.html` -> legacy personal assistant UI
- `/api/*` -> existing serverless endpoints

## Recommended branch flow for playtesting

- `main` -> production
- feature branches -> Vercel preview URLs for playtests

## Phase 3 target: Azure backend

When online multiplayer starts, keep Vercel for the client and move backend services to Azure:

1. Azure Container Apps
- Host deterministic game server container
- Environment variables for config
- Scale-to-zero for low-cost dev

2. Azure Database for PostgreSQL Flexible Server
- Match state, accounts, profile metadata

3. Azure SignalR Service
- Async/live turn notifications and multiplayer event fanout

4. Optional later
- Notification Hubs for mobile push

## Minimal future env vars (backend-ready)

Keep these names reserved for when you wire the Azure game server:

- `HEGEMON_API_BASE_URL`
- `HEGEMON_SIGNALR_ENDPOINT`
- `HEGEMON_SIGNALR_KEY`
- `HEGEMON_PG_CONNECTION`
- `HEGEMON_JWT_SECRET`

## Cost controls (recommended now)

- Create an Azure budget alert before backend work starts
- Use lower-cost development tiers first
- Keep preview environments ephemeral
