# Deployment Guide (Render Monolith)

This project is set up to run as a monolithic app on Render: one Node.js service that serves the frontend (from `vanilla-version/`) and the API under `/api`.

## Prerequisites
- A PostgreSQL database (Render PostgreSQL add-on or any reachable Postgres)
- A JWT secret

## Environment variables
Set these in the Render service dashboard (or locally in `.env`):

- `DATABASE_URL` (recommended) — Example: `postgresql://<user>:<password>@<host>:<port>/<db>`
- `PGSSL` (optional) — Set to `true` if your provider requires SSL (Render Postgres often does)
- `JWT_SECRET` — Your secret for signing JWTs
- `PORT` — Render sets this automatically; you can omit

Alternatively, individual Postgres vars are supported if you don’t use `DATABASE_URL`:
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSSL`

## Render configuration
- Start command: `node server.js` (already defined as `npm start` in `package.json`)
- Build command: leave empty (not required)

## Health check
- Endpoint: `/health` should return `{ "status": "healthy" }`

## Notes
- In production, the frontend uses a relative base URL (`/api`) automatically.
- For split hosting (GitHub Pages + Render), set `window.API_BASE_URL` in your index HTML or add CORS to the server.
