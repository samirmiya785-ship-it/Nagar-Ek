# Nagar-Ek Backend API

Nagar-Ek Backend is the API layer for the Nagar-Ek civic app. It provides authentication, community alert reporting, government service guidance, transport route information, dashboard stats, and map-based location data for frontend clients.

## Base URL

- Local development: http://localhost:4000
- API prefix: /api

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Create environment variables

Create a `.env` file in the project root:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/nagar-ek
JWT_SECRET=your_super_secret_key
```

### 3) Run the server

```bash
npm run dev
```

The server will start on port 4000 and Swagger docs will be available at:

```text
http://localhost:4000/api/docs
```

---

## Authentication

Most protected endpoints require a Bearer token.

### How frontend should authenticate

1. Register or log in using the auth endpoints below.
2. Save the returned `token` in memory or storage.
3. Add it to future requests:

```http
Authorization: Bearer <token>
```

### Common response patterns

- Success: returns a JSON object or array.
- Validation errors: returns `400` with an `errors` array.
- Unauthorized: returns `401` with a message.
- Not found: returns `404` with a message.

---

## Endpoint Guide

### 1) Auth

#### Register a user
- Method: `POST`
- Path: `/api/auth/register`
- Auth: No

Request body:

```json
{
  "name": "Asha Kumar",
  "phone": "+919876543210",
  "email": "asha@example.com",
  "password": "password123",
  "location": {
    "type": "Point",
    "coordinates": [77.5946, 12.9716]
  }
}
```

Response:

```json
{
  "user": {
    "id": "...",
    "name": "Asha Kumar",
    "email": "asha@example.com",
    "phone": "+919876543210",
    "points": 0,
    "location": {
      "type": "Point",
      "coordinates": [77.5946, 12.9716]
    }
  },
  "token": "..."
}
```

#### Login
- Method: `POST`
- Path: `/api/auth/login`
- Auth: No

Request body:

```json
{
  "identifier": "asha@example.com",
  "password": "password123"
}
```

#### Get current user profile
- Method: `GET`
- Path: `/api/auth/me`
- Auth: Required

#### Logout
- Method: `POST`
- Path: `/api/auth/logout`
- Auth: Required

---

### 2) Alerts

#### Create a new alert
- Method: `POST`
- Path: `/api/alerts`
- Auth: Required

Request body:

```json
{
  "title": "Water leakage",
  "description": "Water is overflowing near the main road",
  "category": "infrastructure",
  "location": {
    "type": "Point",
    "coordinates": [77.595, 12.972]
  }
}
```

Notes:
- The alert must be within 15 km of the authenticated user's saved location.
- A reward point is assigned on successful creation.

#### Get all visible alerts
- Method: `GET`
- Path: `/api/alerts`
- Auth: No

#### Get nearby alerts
- Method: `GET`
- Path: `/api/alerts/near`
- Auth: Required

This uses the authenticated user's location to find alerts nearby.

#### Get recent alerts
- Method: `GET`
- Path: `/api/alerts/recent`
- Auth: No

#### Update alert status
- Method: `PATCH`
- Path: `/api/alerts/:id/status`
- Auth: Required

Request body:

```json
{
  "status": "in_progress"
}
```

Common status values include: `pending`, `in_progress`, `resolved`.

---

### 3) Government guides

#### Search a government service guide
- Method: `GET`
- Path: `/api/government/search?q=birth%20certificate`
- Auth: No

Example:

```bash
curl "http://localhost:4000/api/government/search?q=driver%20license"
```

Response includes the department and required documents.

#### Seed sample government guides
- Method: `POST`
- Path: `/api/government/seed`
- Auth: No

This populates the database with sample guide data.

---

### 4) Transport routes

#### List all transport routes
- Method: `GET`
- Path: `/api/transport`
- Auth: No

#### Get one route by ID
- Method: `GET`
- Path: `/api/transport/:id`
- Auth: No

#### Create a transport route
- Method: `POST`
- Path: `/api/transport`
- Auth: No

Request body:

```json
{
  "routeName": "Route 7",
  "vehicleType": "bus",
  "currentLocation": {
    "type": "Point",
    "coordinates": [77.5955, 12.973]
  },
  "nextStop": "Main Bus Depot",
  "estimatedArrivalMinutes": 12,
  "routePath": {
    "type": "LineString",
    "coordinates": [[77.594, 12.97], [77.596, 12.974]]
  }
}
```

#### Update route location
- Method: `PATCH`
- Path: `/api/transport/:id/location`
- Auth: No

Request body:

```json
{
  "currentLocation": {
    "type": "Point",
    "coordinates": [77.5958, 12.9735]
  },
  "nextStop": "City Center",
  "estimatedArrivalMinutes": 8
}
```

---

### 5) Dashboard

#### Get dashboard summary
- Method: `GET`
- Path: `/api/dashboard`
- Auth: No

Response includes total alerts, counts by status, total routes, user count, progress percentage, and reward items.

---

### 6) Map points of interest

#### Get map POIs
- Method: `GET`
- Path: `/api/map/poi`
- Auth: No

Optional query:

```text
/api/map/poi?type=hospital
```

---

### 7) AI status

#### Check AI route availability
- Method: `GET`
- Path: `/api/ai/status`
- Auth: No

---

## Suggested Frontend Integration Tips

- Store the JWT token after login and include it in the `Authorization` header for protected routes.
- Use `Content-Type: application/json` for JSON payloads.
- For map-based features, use coordinates in the format `[longitude, latitude]`.
- For alert creation, ensure the user profile already has a location value.

## Notes

- The API uses MongoDB with Mongoose.
- The base server is Express.js.
- Swagger documentation is available at `/api/docs` during development.
