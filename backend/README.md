# Backend (Express)

This folder contains a minimal Express backend scaffold for the Smart Attendance project.

Dependencies to install (run inside `/backend`):

```bash
npm install express mongoose dotenv bcryptjs jsonwebtoken cors qrcode
npm install --save-dev nodemon
```

Create an `.env` file from `.env.example` and set required values (`MONGO_URI`, `JWT_SECRET`).

Run in development:

```bash
npm run dev
```

Health check: GET `/api/health`

## Production Notes (Railway)

- App listens on `0.0.0.0:$PORT` for Railway public networking.
- `JWT_SECRET` and `MONGO_URI` are required at startup.
- CORS allowlist is read from `CORS_ORIGIN` (or `APP_ORIGIN` fallback).
- QR links use `APP_ORIGIN` when request origin is unavailable.
- Super admin seeding is disabled by default and only runs when `SEED_SUPERADMIN=true`.
