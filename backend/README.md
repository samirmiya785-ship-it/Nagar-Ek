# Sustainable Cities Backend

Backend for the sustainable cities app with alert reporting, government office guide, smart travel assistant, dashboard, map services, and chatbot integration.

## Setup

1. Navigate to `backend`
2. Run `npm install`
3. Copy `.env.example` to `.env` and set values
4. Run `npm run dev`

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
