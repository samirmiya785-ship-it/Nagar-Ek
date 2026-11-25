# Sustainable Cities Backend

Backend for the sustainable cities app with alert reporting, government office guide, smart travel assistant, dashboard, map services, and chatbot integration.

## Setup

1. Navigate to `backend`.
2. Create a `.env` file in that directory (repository path `backend/.env`) with `MONGODB_URI` and `JWT_SECRET`. `PORT` is optional and defaults to `4000`.
3. Install dependencies and start the API:

   ```bash
   npm install
   npm run dev
   ```

Swagger API docs are available at `http://localhost:4000/api/docs`.

> This backend no longer depends on Google Maps or Google geocoding. Use OpenStreetMap/Leaflet and generic OSM-compatible geocoding providers for frontend mapping, POI visualization, and address lookup.

## Features

- User auth, rewards, and location validation
- Alert reporting with category, location, and status
- Government department search helper
- Dashboard summary endpoints
- Public transport route suggestions
- Map POI endpoints for hospitals, police, schools, and transit using OpenStreetMap/Leaflet patterns
- Socket-based real-time alerts
- Swagger API docs
