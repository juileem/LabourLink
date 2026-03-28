# LabourLink

Dual-role web app for construction workers and contractors built with React, TypeScript, Tailwind CSS, Node.js, Express, and SQLite.

## Structure

- `client/` React + Vite frontend
- `server/` Express + SQLite backend

## Run

1. Install dependencies:
   - `npm install --prefix client`
   - `npm install --prefix server`
2. Start backend:
   - `npm run dev:server`
3. Start frontend:
   - `npm run dev:client`

Frontend runs on `http://localhost:5173`
Backend runs on `http://localhost:4000`

## Demo shortcuts

- Mock OTP is `1234`
- Login is phone-based only
- Auth state is stored in `localStorage`
- Ratings are seeded/mock values.
