# Backend (Express)

This folder contains a minimal Express backend scaffold for the Smart Attendance project.

Dependencies to install (run inside `/backend`):

```bash
npm install express mongoose dotenv bcryptjs jsonwebtoken cors qrcode
npm install --save-dev nodemon
```

Create an `.env` file from `.env.example` and set `MONGO_URI` and `JWT_SECRET`.

Run in development:

```bash
npm run dev
```

Health check: GET `/api/health`
