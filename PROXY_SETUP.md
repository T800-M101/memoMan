# Proxy Configuration Guide — Memoman

## Overview

Memoman uses a two-layer approach to handle API requests:

1. **Proxy backend** (`server.js` on port `3001`) — for external URLs, handles CORS and acts as intermediary
2. **Direct `HttpClient`** — for local URLs (`localhost`, `127.0.0.1`), bypasses the proxy entirely

This distinction is important: Node.js (axios) can call any localhost port freely, but the proxy cannot call itself.

---

## Architecture

```
External URLs:
Angular (4200) → POST /api/proxy → Proxy Backend (3001) → Target API

Local URLs:
Angular (4200) → HttpClient direct → Local API (3000, 8080, etc.)
```

---

## Configuration Files

### `proxy.conf.json`

```json
{
  "/api/*": {
    "target": "http://localhost:3001",
    "secure": false,
    "logLevel": "debug",
    "pathRewrite": {
      "^/api": ""
    }
  }
}
```

Rewrites Angular requests to the proxy backend:

```
http://localhost:4200/api/proxy?url=... → http://localhost:3001/proxy?url=...
```

### `angular.json`

```json
"serve": {
  "builder": "@angular/build:dev-server",
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

### `backend/server.js`

Express running on port `3001` with the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/proxy?url={target}` | POST | Proxies request to external URL via axios |
| `/health` | GET | Server health check |
| `/` | GET | Server info |

---

## Logic in `RequestService`

### Local URL detection

```typescript
private isLocalUrl(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1');
}
```

### `executeRequest()` flow

```typescript
const isLocal = this.isLocalUrl(config.url);

const result = isLocal
  ? await this.executeDirectRequest(payload)    // direct HttpClient call
  : await lastValueFrom(this.sendRequest(payload)); // via proxy backend
```

### `executeDirectRequest()` — for local URLs

Uses `this.http.request()` with `observe: 'response'` to capture status, headers, and body directly from Angular without going through the proxy backend.

### `sendRequest()` — for external URLs

Makes a `POST http://localhost:3001/proxy?url={target}` with method, headers, and body in the request body. The proxy backend uses axios to perform the actual call.

---

## Running the Project

### Step 1: Start the proxy backend

```bash
cd backend
node server.js
```

Expected output:

```
🚀 Memoman Proxy Server
📍 Running at http://localhost:3001
📡 Health check: http://localhost:3001/health
🔧 Proxy endpoint: POST http://localhost:3001/proxy?url=YOUR_URL

✅ Server is ready!
```

### Step 2: Start Angular

```bash
ng serve
# or
npm start
```

Angular runs at `http://localhost:4200`.

### Step 3 (optional): Run both with a single command

Install dev dependencies:

```bash
npm install --save-dev concurrently nodemon
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "start": "ng serve",
    "backend": "node backend/server.js",
    "backend:watch": "nodemon backend/server.js",
    "dev": "concurrently \"npm run backend\" \"npm start\""
  }
}
```

Then run:

```bash
npm run dev
```

---

## Test URLs

| Type | Example | Route |
|------|---------|-------|
| External | `https://jsonplaceholder.typicode.com/posts/1` | Via proxy backend (3001) |
| Local different port | `http://localhost:3000/api/users` | Direct HttpClient |
| Local same as proxy | `http://localhost:3001/health` | ⚠️ See note below |

> ⚠️ To test the proxy backend's own health check, use `http://localhost:3001/health` with `GET` directly in the browser or via curl — not from the Memoman client, since `executeDirectRequest` would be calling the same process.

---

## Troubleshooting

### `Cannot POST /health`
The proxy is calling itself. Make sure the backend is running on port `3001`, not `3000`.

### `Error connecting` on local URLs
The local API does not have CORS enabled. Add it to your local server:
```javascript
app.use(cors()); // Express
// or in NestJS:
app.enableCors();
```

### Angular proxy not intercepting the request
Make sure `proxyConfig` is set in `angular.json` and restart `ng serve` — the Angular proxy does not hot-reload.

### Port 3001 already in use
```bash
lsof -ti:3001 | xargs kill -9
```

---

## Production

⚠️ The Angular proxy (`proxy.conf.json`) only works in development mode.

For production, deploy `backend/server.js` separately and configure the URL in Angular's environment files:

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  proxyUrl: 'https://your-backend.com/proxy'
};
```

---

**Last updated:** June 2026  
**Angular:** 21  
**Node.js proxy:** Express + axios on port 3001
