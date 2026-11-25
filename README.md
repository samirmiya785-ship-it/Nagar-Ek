# Nagar-Ek

Nagar-Ek is a sustainable-cities project with an Expo mobile app and Express/MongoDB APIs for authentication, alerts, government services, maps, transport, and real-time updates.

## Project layout

- [`nagar-ek/`](./nagar-ek/) — Expo Router mobile app and the backend source repository it references
- [`nagar-ek/nagar-ek-backend/`](./nagar-ek/nagar-ek-backend/) — backend from the cloned Nagar-Ek project
- [`backend/`](./backend/) — backend already present in this repository; retained separately
- [`server.js`](./server.js) — entry point for the existing root API

## Run locally

### Backend from the mobile app project

1. Create `nagar-ek/nagar-ek-backend/.env` and set `MONGODB_URI` and `JWT_SECRET`. `PORT` is optional and defaults to `4000`.
2. From `nagar-ek/nagar-ek-backend/`, install dependencies and start the API:

   ```bash
   npm install
   npm run dev
   ```

The API documentation is served at `http://localhost:4000/api/docs`.

The pre-existing API in `backend/` has its own setup notes in [`backend/README.md`](./backend/README.md).

### Mobile app

1. Set `EXPO_PUBLIC_API_URL` in `nagar-ek/.env` to the API's reachable base URL, including `/api` (for example, `http://localhost:4000/api`).
2. From `nagar-ek/`, install dependencies and start Expo:

   ```bash
   npm install
   npm start
   ```

For a physical device or emulator, use an API host address reachable from that device instead of `localhost`.

Do not commit `.env` files or credentials.
