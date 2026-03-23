# Node.js Foundation Web App — Source Code Documentation

A learning-oriented reference for every file, module, and key line of code in this project.

---

## Table of Contents

1. [What This App Does](#1-what-this-app-does)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [How to Run Locally](#4-how-to-run-locally)
5. [Architecture Overview](#5-architecture-overview)
6. [Data Flow Diagrams](#6-data-flow-diagrams)
7. [Backend — File by File](#7-backend--file-by-file)
   - [server.js](#71-serverjs)
   - [middleware/auth.js](#72-middlewareauthjs)
   - [routes/auth.js](#73-routesauthjs)
   - [routes/stats.js](#74-routesstatsjs)
8. [Frontend — File by File](#8-frontend--file-by-file)
   - [index.html](#81-indexhtml)
   - [vite.config.js](#82-viteconfigjs)
   - [src/main.jsx](#83-srcmainjsx)
   - [src/App.jsx](#84-srcappjsx)
   - [src/context/AuthContext.jsx](#85-srccontextauthcontextjsx)
   - [src/components/Navbar.jsx](#86-srccomponentsnavbarjsx)
   - [src/components/ProtectedRoute.jsx](#87-srccomponentsprotectedroutejsx)
   - [src/pages/PublicPage.jsx](#88-srcpagespublicpagejsx)
   - [src/pages/LoginPage.jsx](#89-srcpagesloginpagejsx)
   - [src/pages/AdminPage.jsx](#810-srcpagesadminpagejsx)
   - [src/index.css](#811-srcindexcss)
9. [API Reference](#9-api-reference)
10. [Key Concepts Explained](#10-key-concepts-explained)
11. [npm Packages Reference](#11-npm-packages-reference)
12. [Security Notes](#12-security-notes)

---

## 1. What This App Does

Node.js Foundation Web App is a minimal full-stack web application that demonstrates:

- A **public page** accessible by anyone, which silently records every visit
- A **login page** that authenticates an admin using a username and password, returning a JWT
- A **protected admin dashboard** (requires login) that displays live visitor stats:
  - Total visits
  - Unique visitors
  - Per-visit details: timestamp, OS, browser, and country of origin

It is intentionally simple — no database, no complex state management library — so that every line of code can be understood without prerequisite knowledge.

---

## 2. Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.18 | HTTP server and routing framework |
| `cors` | ^2.8 | Allow cross-origin requests from the frontend dev server |
| `jsonwebtoken` | ^9.0 | Sign and verify JSON Web Tokens (JWTs) |
| `bcryptjs` | ^2.4 | Hash and compare passwords securely |
| `ua-parser-js` | ^1.0 | Parse the `User-Agent` header into OS and browser details |
| `uuid` | ^9.0 | Available in dependencies (not currently used — fingerprinting uses Node's built-in `crypto`) |
| `nodemon` | ^3.0 | Dev tool: auto-restarts the server when files change |
| `crypto` | built-in | Node.js built-in module — used to SHA-256 hash the visitor fingerprint |

> **Module system:** The backend uses **ES Modules** (`"type": "module"` in `backend/package.json`).
> All files use `import`/`export` syntax. Local imports **must** include the `.js` extension
> (e.g. `import authRoutes from './routes/auth.js'`) because ES modules do not auto-resolve extensions.

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.2 | UI component library |
| `react-dom` | ^18.2 | Renders React components into the browser DOM |
| `react-router-dom` | ^6.22 | Client-side routing (URL → component mapping) |
| `vite` | ^5.1 | Build tool and dev server with fast hot-reload |
| `@vitejs/plugin-react` | ^4.2 | Vite plugin that adds JSX support and React Fast Refresh |

### External API
| Service | Purpose |
|---|---|
| `ip-api.com` | Free IP geolocation — resolves an IP address to a country name. No API key required. |

---

## 3. Project Structure

```
nodejs-foundation-webapp/
│
├── package.json                  ← Root scripts to install/run both apps
├── .gitignore                    ← Excludes node_modules from version control
├── vercel.json                   ← Vercel deployment config (frontend static + backend serverless)
│
├── backend/
│   ├── package.json              ← Backend dependencies
│   ├── server.js                 ← Express app entry point
│   ├── middleware/
│   │   └── auth.js               ← JWT verification middleware
│   └── routes/
│       ├── auth.js               ← /api/auth/* endpoints (login, me)
│       └── stats.js              ← /api/stats/* endpoints (visit, visitors)
│
└── frontend/
    ├── package.json              ← Frontend dependencies
    ├── vite.config.js            ← Vite configuration + dev proxy
    ├── index.html                ← Single HTML shell (React mounts here)
    └── src/
        ├── main.jsx              ← React bootstrap: mounts App into DOM
        ├── App.jsx               ← Root component: router + layout
        ├── index.css             ← Global stylesheet
        ├── context/
        │   └── AuthContext.jsx   ← Global auth state (user, token, login, logout)
        ├── components/
        │   ├── Navbar.jsx        ← Top navigation bar (changes with auth state)
        │   └── ProtectedRoute.jsx ← Route guard: redirects unauthenticated users
        └── pages/
            ├── PublicPage.jsx    ← Public landing page (tracks visits)
            ├── LoginPage.jsx     ← Admin login form
            └── AdminPage.jsx     ← Admin visitor stats dashboard
```

---

## 4. How to Run Locally

You need **two terminal windows** running simultaneously.

### Step 1 — Install dependencies

```bash
# Terminal 1: backend
cd nodejs-foundation-webapp/backend
npm install

# Terminal 2: frontend
cd nodejs-foundation-webapp/frontend
npm install
```

### Step 2 — Start the backend

```bash
cd nodejs-foundation-webapp/backend
npm run dev          # uses nodemon (auto-restarts on file changes)
# or
npm start            # uses plain node (no auto-restart)
```

Expected output:
```
Backend running on http://localhost:5000
```

### Step 3 — Start the frontend

```bash
cd nodejs-foundation-webapp/frontend
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in Xms
  ➜  Local:   http://localhost:5173/
```

### Step 4 — Open the browser

| URL | Who can access |
|---|---|
| `http://localhost:5173/` | Everyone |
| `http://localhost:5173/login` | Everyone (it's the login form) |
| `http://localhost:5173/admin` | Admin only (redirects to /login if not logged in) |

**Admin credentials:** username `admin`, password `admin123`

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 React App (port 5173)                     │   │
│  │                                                           │   │
│  │  PublicPage  ──────────────────────────────────────────► │   │
│  │  LoginPage   ──── POST /api/auth/login ────────────────► │   │──┐
│  │  AdminPage   ──── GET  /api/stats/visitors ────────────► │   │  │
│  └──────────────────────────────────────────────────────────┘   │  │
│                           │ Vite proxy                           │  │
└───────────────────────────┼─────────────────────────────────────┘  │
                            │ forwards /api/* to localhost:5000       │
                            ▼                                         │
┌─────────────────────────────────────────────────────────────────┐  │
│                  Express Backend (port 5000)                      │  │
│                                                                   │  │
│  server.js                                                        │  │
│    ├── CORS middleware          (allows port 5173)                │  │
│    ├── JSON body parser         (req.body)                        │  │
│    ├── /api/auth  → routes/auth.js                                │  │
│    │       ├── POST /login      → issues JWT                      │◄─┘
│    │       └── GET  /me         → verifies JWT                    │
│    └── /api/stats → routes/stats.js                               │
│            ├── POST /visit      → records visit (public)          │
│            └── GET  /visitors   → returns stats (JWT required)    │
│                                                                   │
│  In-memory store:                                                 │
│    totalVisits (number)                                           │
│    uniqueVisitors (Set)                                           │
│    recentVisits (Array of objects)                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ getCountry() calls ip-api.com
                            ▼
                    ┌───────────────┐
                    │  ip-api.com   │
                    │  (geo lookup) │
                    └───────────────┘
```

---

## 6. Data Flow Diagrams

### 6.1 — Public Page Visit Tracking

```
User opens "/"
     │
     ▼
PublicPage mounts
     │
     └── fetch POST /api/stats/visit  {}   ← body ignored server-side
              │
              ▼
         stats.js router
              ├── totalVisits++
              ├── UAParser(user-agent)  → { os, browser }
              ├── getClientIp(req)      → IP address
              ├── getCountry(ip)        → "Philippines" | "Local" | "Unknown"
              │
              ├── buildFingerprint({ browser, ip, os, lang, ua })
              │       ├── Reads Accept-Language header (lang)
              │       ├── Joins: "browser|ip|os|lang|ua"
              │       └── SHA-256 hash → fixed-length hex key
              │
              ├── uniqueVisitors.add(fingerprint)  ← Set ignores duplicates
              └── recentVisits.unshift({ timestamp, os, browser, country })
```

**Why server-side fingerprinting?**
The previous approach relied on a UUID generated in the browser and stored in `localStorage`. This could be spoofed, cleared, or omitted by the client. The new approach derives uniqueness entirely from server-readable signals — no client co-operation needed.

### 6.2 — Admin Login Flow

```
Admin submits login form
     │
     ▼
LoginPage.handleSubmit()
     │
     └── fetch POST /api/auth/login  { username, password }
              │
              ▼
         auth.js router
              ├── Find user in USERS array by username
              ├── bcrypt.compare(password, user.passwordHash)
              └── If match: jwt.sign({ id, username, role }, JWT_SECRET, { expiresIn: '8h' })
                       │
                       ▼
                  { token, user } → response
                       │
                       ▼
              LoginPage receives token
              ├── AuthContext.login(user, token)  → setState + localStorage.setItem('token')
              └── navigate('/admin')
```

### 6.3 — Admin Page Stats Fetch

```
AdminPage mounts
     │
     ├── fetchStats() immediately
     │
     └── setInterval(fetchStats, 10000)  ← every 10 seconds
              │
              ▼
         fetch GET /api/stats/visitors
              │  Authorization: Bearer <token>
              ▼
         middleware/auth.js (verifyToken)
              ├── Read Authorization header
              ├── Extract token after "Bearer "
              ├── jwt.verify(token, JWT_SECRET)
              ├── If valid: req.user = decoded payload → next()
              └── If invalid: 401 Unauthorized
                       │ (if valid)
                       ▼
                  stats.js GET /visitors
                       └── res.json({ totalVisits, uniqueVisitors, recentVisits })
                                │
                                ▼
                           AdminPage renders KPI cards + visit list
```

### 6.4 — Session Restore on Page Refresh

```
User refreshes the browser
     │
     ▼
AuthContext useEffect (runs once on mount)
     │
     ├── localStorage.getItem('token')
     │       │
     │       ├── Token found:
     │       │       └── fetch GET /api/auth/me  { Authorization: Bearer <token> }
     │       │               ├── Backend verifies token
     │       │               ├── If valid:   setUser(data.user), setToken(savedToken)
     │       │               └── If invalid: localStorage.removeItem('token')
     │       │
     │       └── No token: setLoading(false)  ← user stays logged out
     │
     └── setLoading(false)  ← ProtectedRoute can now render safely
```

---

## 7. Backend — File by File

---

### 7.1 `server.js`

**Role:** Application entry point. Creates the Express app, registers middleware, mounts route modules, and starts listening for HTTP connections.

**Key lines explained:**

| Line(s) | Code | Why it matters |
|---|---|---|
| 13–14 | `import express from 'express'` / `import cors from 'cors'` | ES module default imports. Each package exports one main object; `import X from 'pkg'` binds it to the name `X`. This replaces CommonJS `const X = require('pkg')`. |
| 17–18 | `import authRoutes from './routes/auth.js'` | Local ES module import. The `.js` extension is **required** — unlike CommonJS `require()`, ES modules do not auto-resolve file extensions. |
| 22–23 | `const app = express(); const PORT = 5000` | Creates the Express application instance and defines which TCP port to listen on. |
| 30 | `app.use(cors({ origin: 'http://localhost:5173' }))` | Registers CORS middleware globally. Without this, the browser would block API responses because the React app (port 5173) and the API (port 5000) are on different origins. |
| 33 | `app.use(express.json())` | Parses the JSON body of incoming POST/PUT requests. Without this, `req.body` would be `undefined`. |
| 40–43 | `app.use('/api/auth', ...)` / `app.use('/api/stats', ...)` | Mounts each router under a URL prefix. A route defined as `router.get('/me', ...)` inside `routes/auth.js` becomes accessible at `GET /api/auth/me`. |
| 47–49 | `app.listen(PORT, callback)` | Binds the server to the port. The callback fires once the server is ready to accept connections. |

---

### 7.2 `middleware/auth.js`

**Role:** A reusable Express middleware function (`verifyToken`) that protects routes by checking for a valid JWT in the `Authorization` request header. Also exports the `JWT_SECRET` constant so route files can sign new tokens with the same key.

**How Express middleware works:**

Every middleware function receives three arguments:
- `req` — the incoming request (headers, body, params, etc.)
- `res` — the outgoing response (used to send data back)
- `next` — a function that, when called, passes control to the next middleware or route handler in the chain

```
Request → middleware A → middleware B → route handler → Response
                ↓ (if invalid)
           res.status(401).json(...)   ← short-circuit, never calls next()
```

**Key lines explained:**

| Line(s) | Code | Why it matters |
|---|---|---|
| 15 | `import jwt from 'jsonwebtoken'` | Default import — binds the library's exported object to `jwt`. Replaces CommonJS `const jwt = require('jsonwebtoken')`. |
| 20 | `const JWT_SECRET = '...'` | The signing secret. **In production this must be a long random string stored in an environment variable** (`process.env.JWT_SECRET`), never hard-coded in source code. |
| 63 | `export { verifyToken, JWT_SECRET }` | **Named exports** — the ES module replacement for `module.exports = { verifyToken, JWT_SECRET }`. Other files import these with `import { verifyToken, JWT_SECRET } from './middleware/auth.js'`. |
| 30 | `req.headers['authorization']` | HTTP headers are key-value pairs sent with every request. The `Authorization` header uses the format `Bearer <token>`. |
| 38 | `authHeader.split(' ')[1]` | Splits `"Bearer eyJh..."` on the space, giving `["Bearer", "eyJh..."]`. Index `[1]` extracts just the token string. |
| 47 | `jwt.verify(token, JWT_SECRET, callback)` | Checks three things: (1) the token was signed with `JWT_SECRET`, (2) the signature hasn't been tampered with, (3) the `exp` claim hasn't passed. |
| 55 | `req.user = decoded` | Attaches the decoded payload to the request object so the next handler can read `req.user.role`, `req.user.id`, etc. |
| 58 | `next()` | Passes control downstream. Without this call, the request would hang indefinitely. |

---

### 7.3 `routes/auth.js`

**Role:** Defines the two authentication endpoints — login (issues a JWT) and `/me` (verifies a JWT and returns the user).

**Imports at the top of the file:**

```js
import express from 'express';                              // default import
import bcrypt  from 'bcryptjs';                             // default import
import jwt     from 'jsonwebtoken';                         // default import
import { verifyToken, JWT_SECRET } from '../middleware/auth.js'; // named imports
```

- **Default imports** (`import X from 'pkg'`) bind a package's single main export.
- **Named imports** (`import { a, b } from './file.js'`) destructure specific exports from a module.
- The `.js` extension on local paths is **mandatory** in ES modules.

**In-memory user store:**

```js
const USERS = [
  {
    id: 1,
    username: 'admin',
    passwordHash: bcrypt.hashSync('admin123', 10),  // cost factor = 10 rounds
    role: 'admin',
  },
];
```

Passwords are **never** stored as plain text. `bcrypt.hashSync` applies a one-way cryptographic hash. The cost factor (`10`) controls how much CPU work is required — higher = slower to brute-force.

**Key lines explained:**

| Line(s) | Code | Why it matters |
|---|---|---|
| 20 | `const router = express.Router()` | Creates a mini Express application. Think of it as a sub-app responsible only for auth routes. |
| 54 | `USERS.find(u => u.username === username)` | Linear search through the users array. In a real app this would be a database query. |
| 64 | `bcrypt.compare(password, user.passwordHash)` | Hashes the submitted plain-text password and compares it to the stored hash. Returns a boolean. This is async (`await`) because hashing is CPU-intensive and would block the event loop if synchronous. |
| 73 | `const payload = { id, username, role }` | Only safe, non-sensitive fields go in the JWT payload. The payload is base64-encoded (NOT encrypted) so anyone with the token can read it. |
| 77 | `jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' })` | Creates a signed JWT. The `expiresIn` option adds an `exp` claim so the token automatically becomes invalid after 8 hours. |
| 93–95 | `router.get('/me', verifyToken, handler)` | The second argument (`verifyToken`) is the middleware that runs before the handler. Only requests with a valid token reach the handler. |
| 102 | `export default router` | **Default export** — the ES module replacement for `module.exports = router`. One file, one default export. Consumers import with `import authRoutes from './routes/auth.js'`. |

---

### 7.4 `routes/stats.js`

**Role:** Tracks public page visits and exposes aggregated statistics to the admin dashboard.

**In-memory data store:**

```js
let totalVisits      = 0;         // Increments on every POST /visit
const uniqueVisitors = new Set(); // Stores SHA-256 fingerprint hashes — duplicates ignored automatically
const recentVisits   = [];        // Array of visit objects, capped at 10 entries
```

**Helper functions:**

#### `getClientIp(req)`
Reads the IP address from the most reliable source available:
- If behind a proxy/load-balancer: reads `X-Forwarded-For` header (set by the proxy)
- Direct connection: reads `req.socket.remoteAddress`

The `X-Forwarded-For` format is `clientIp, proxy1, proxy2` — we split on `,` and take the first value.

#### `isLocalIp(ip)`
Returns `true` for loopback addresses (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`). Used to skip the geo API when running locally because these IPs cannot be resolved to a real country.

#### `getCountry(ip)` _(async)_
Calls `http://ip-api.com/json/{ip}?fields=status,country` to resolve a country name from an IP address.

- Returns `"Local"` for loopback IPs
- Returns `"Unknown"` if the API call fails or the IP is a private range
- Uses `async/await` because the HTTP request is asynchronous (non-blocking)

#### `buildFingerprint({ browser, ip, os, lang, ua })`
Builds a stable, anonymous visitor key entirely from server-readable signals:

| Signal | Source | Example |
|---|---|---|
| `browser` | UA-Parser (name + major version) | `"Chrome 120"` |
| `ip` | `getClientIp(req)` | `"203.0.113.5"` |
| `os` | UA-Parser (name + version) | `"Windows 10"` |
| `lang` | `Accept-Language` header | `"en-US,en;q=0.9"` |
| `ua` | Raw `User-Agent` header | `"Mozilla/5.0 ..."` |

The five values are joined with `|` and passed through `crypto.createHash('sha256')` to produce a fixed-length hex string. Using a hash means the stored key contains no raw PII and is always the same length regardless of input size.

**Imports at the top of the file:**

```js
import express  from 'express';                        // default import
import UAParser from 'ua-parser-js';                   // default import
import crypto   from 'crypto';                         // Node built-in — SHA-256 hashing
import { verifyToken } from '../middleware/auth.js';   // named import (only what's needed)
```

Named imports let you import only specific exports, keeping each file's dependencies explicit.

**Key lines explained:**

| Line(s) | Code | Why it matters |
|---|---|---|
| 35 | `const uniqueVisitors = new Set()` | A `Set` is a collection where every value is unique. `set.add(x)` silently ignores `x` if it already exists — perfect for tracking distinct visitors without any extra logic. |
| 80 | `fetch(\`http://ip-api.com/json/${ip}?fields=status,country\`)` | `fetch` is available globally in Node 18+ — no import required. The `fields` query parameter asks the API to return only `status` and `country`, reducing network payload. |
| 98–102 | `buildFingerprint(...)` | Joins all five signals into one string and SHA-256 hashes it. Two requests are considered the same visitor only when **all five signals match simultaneously**. |
| 104 | `uniqueVisitors.add(fingerprint)` | The Set's deduplication handles uniqueness — no `if` needed. If the same fingerprint arrives again, the Set size stays the same. |
| 107 | `router.post('/visit', async (req, res) => {` | The handler is marked `async` because it `await`s `getCountry()` which is itself an async network call. |
| 122 | `const parser = new UAParser(ua)` | Instantiates the User-Agent parser with the raw UA string. All the parsing logic is inside the library. |
| 127–130 | `filter(Boolean).join(' ')` | `filter(Boolean)` removes `undefined` or `null` values from the array (e.g., when version is missing). `join(' ')` concatenates with a space: `['Windows', '10'] → 'Windows 10'`. |
| 130 | `browserInfo.major` | Returns only the major version number (e.g., `"120"` instead of `"120.0.0.0"`) for a cleaner display. |
| 144 | `recentVisits.unshift(visitRecord)` | `unshift` adds to the **front** of the array, keeping index `0` as the most recent visit. The opposite, `push`, adds to the end. |
| 145 | `if (recentVisits.length > 10) recentVisits.pop()` | `pop` removes the last (oldest) element. This caps the array at 10 entries without using `slice`. |
| 163 | `export default router` | Default export — replaces `module.exports = router`. Consumers import with `import statsRoutes from './routes/stats.js'`. |

---

## 8. Frontend — File by File

---

### 8.1 `index.html`

**Role:** The single HTML page that the browser loads. React replaces the content of `<div id="root">` with the entire component tree.

This is the foundation of a **Single-Page Application (SPA)**. After the initial load, all navigation is handled by JavaScript — the browser never requests a new HTML page.

```html
<div id="root"></div>                    <!-- React mounts here -->
<script type="module" src="/src/main.jsx"></script>  <!-- Vite injects this -->
```

`type="module"` tells the browser to treat the script as an ES Module, enabling `import`/`export` syntax.

---

### 8.2 `vite.config.js`

**Role:** Configures the Vite build tool. Two key settings:

1. **React plugin** — Enables JSX compilation (converting `<MyComponent />` syntax to `React.createElement()` calls) and **React Fast Refresh** (hot module replacement that preserves component state when you save a file).

2. **Dev proxy** — Forwards any request whose path starts with `/api` from port `5173` to the backend at port `5000`. This is why the frontend can write `fetch('/api/stats/visit')` without specifying a port.

```
Browser → GET localhost:5173/api/stats/visitors
Vite proxy → GET localhost:5000/api/stats/visitors   (transparent)
```

Without the proxy, the browser would block the request with a CORS error because `localhost:5173` and `localhost:5000` are different origins.

---

### 8.3 `src/main.jsx`

**Role:** Application bootstrap. The only file that directly touches the DOM.

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- `createRoot` is the React 18 API for mounting. It replaces the older `ReactDOM.render()`.
- `React.StrictMode` is a development-only wrapper that deliberately double-invokes lifecycle methods to surface side-effect bugs early. It has no impact on production.

---

### 8.4 `src/App.jsx`

**Role:** Root component. Defines the entire routing tree and wraps everything in the auth context provider.

**Component tree it renders:**

```
<AuthProvider>              ← provides user/token/login/logout to all descendants
  <BrowserRouter>           ← enables URL-based routing
    <Navbar />              ← always visible, outside the route switch
    <main>
      <Routes>              ← renders only the first matching route
        <Route path="/" />              → <PublicPage />
        <Route path="/login" />         → <LoginPage />
        <Route path="/admin" />         → <ProtectedRoute><AdminPage /></ProtectedRoute>
        <Route path="*" />              → <Navigate to="/" />  (catch-all)
      </Routes>
    </main>
  </BrowserRouter>
</AuthProvider>
```

**Why `AuthProvider` wraps `BrowserRouter`:**
`AuthProvider` must be the outermost wrapper so that `Navbar` (which needs auth state) can call `useAuth()` — and `Navbar` must be inside `BrowserRouter` to use `Link` and `useNavigate`. The order is: `AuthProvider` → `BrowserRouter` → everything else.

---

### 8.5 `src/context/AuthContext.jsx`

**Role:** Global authentication state management using React Context.

**The problem it solves — "prop drilling":**
Without context, you would need to pass `user` and `token` as props from `App` → every page → every component that needs them. Context lets any component in the tree read the auth state directly.

**What it provides:**

| Value | Type | Description |
|---|---|---|
| `user` | `object \| null` | `{ id, username, role }` when logged in, `null` when logged out |
| `token` | `string \| null` | The raw JWT string used in `Authorization` headers |
| `loading` | `boolean` | `true` while the saved token is being verified on mount |
| `login(user, token)` | function | Saves to state + `localStorage` |
| `logout()` | function | Clears state + `localStorage` |

**Session persistence logic (the `useEffect`):**

When the page loads, `AuthContext` checks `localStorage` for a previously saved token:

```
Page load → useEffect fires → localStorage.getItem('token')
                │
         Token exists? ─── YES ──► GET /api/auth/me (verify with backend)
                │                      ├── Valid:   setUser + setToken
                │                      └── Invalid: localStorage.removeItem
                │
               NO ──────────────────► setLoading(false)
```

This is how "stay logged in" works — the user closes the tab, comes back, and is still authenticated without re-entering credentials.

**`useAuth()` custom hook:**
```jsx
export function useAuth() {
  return useContext(AuthContext);
}
```
Any component can call `const { user, logout } = useAuth()` instead of the more verbose `useContext(AuthContext)`. This is a standard React pattern.

---

### 8.6 `src/components/Navbar.jsx`

**Role:** Top navigation bar rendered on every page. Its links change based on whether the user is logged in.

**Conditional rendering pattern:**

```jsx
{user ? (
  // Logged-in: show Admin Dashboard link + Logout button
  <>
    <Link to="/admin">Admin Dashboard</Link>
    <button onClick={handleLogout}>Logout ({user.username})</button>
  </>
) : (
  // Logged-out: show Login link only
  <Link to="/login">Login</Link>
)}
```

The `?` ternary operator checks if `user` is truthy (an object) or falsy (`null`).

**`useNavigate` hook:**
`navigate('/login')` in `handleLogout` performs a programmatic redirect — the same as clicking a link but triggered by JavaScript. It is used here because logout involves calling `logout()` first, then redirecting.

---

### 8.7 `src/components/ProtectedRoute.jsx`

**Role:** A wrapper component that guards routes. If the user is not authenticated, they are redirected to the login page.

**Three possible outcomes:**

```jsx
if (loading) return null;           // Still verifying token — render nothing
if (!user) return <Navigate to="/login" replace />;  // Not logged in — redirect
return children;                    // Logged in — render the protected page
```

**Why `loading` matters:**
On page refresh, `AuthContext` needs a moment to verify the saved token. If `ProtectedRoute` checked `!user` immediately, it would see `null` (the initial state) and redirect to login — even for a valid, logged-in user. The `loading` flag prevents this brief incorrect redirect.

**`replace` prop on `<Navigate>`:**
Without `replace`, visiting `/admin` while logged out would push `/login` onto the browser history stack. Clicking Back would go back to `/admin`, which would redirect again — an infinite loop. `replace` replaces the current history entry instead of adding one.

---

### 8.8 `src/pages/PublicPage.jsx`

**Role:** The public landing page. Silently records every visit.

**Fire-and-forget visit recording:**

```jsx
useEffect(() => {
  fetch('/api/stats/visit', { method: 'POST', ... }).catch(() => {
    console.warn('Could not record visit');
  });
}, []);
```

The visit is recorded silently in the background. The `catch` block suppresses errors so that a backend outage never breaks the page for visitors.

`useEffect` with `[]` (empty dependency array) runs exactly once — after the component first renders (mounts). This is the equivalent of "on page load."

> **Note:** The frontend code still calls `getOrCreateVisitorId()` and sends `visitorId` in the request body. The backend now **ignores** this field — unique visitor detection is handled server-side via a SHA-256 fingerprint (see [routes/stats.js](#74-routesstatsjs)). The `getOrCreateVisitorId` function in the frontend is now a no-op from the backend's perspective.

---

### 8.9 `src/pages/LoginPage.jsx`

**Role:** The admin login form. Handles credential submission, backend communication, error display, and redirects.

**Controlled inputs pattern:**

```jsx
const [username, setUsername] = useState('');

<input
  value={username}                          // input value = React state
  onChange={e => setUsername(e.target.value)} // every keystroke updates state
/>
```

React "controls" the input — the DOM value is always a reflection of React state. This makes reading the form values trivial: just read `username` and `password` from state.

**`handleSubmit` flow:**

```
e.preventDefault()          ← stop browser from reloading the page
setError('')                ← clear previous error
setLoading(true)            ← disable the submit button

fetch POST /api/auth/login  ← send credentials to backend
  │
  ├── res.ok === false  →  setError(data.message)   ← show error
  │
  └── res.ok === true   →  login(data.user, data.token)  ← save to context
                           navigate('/admin')             ← redirect

finally: setLoading(false)  ← always re-enable the button
```

The `finally` block runs regardless of success or failure, ensuring `loading` is always reset.

---

### 8.10 `src/pages/AdminPage.jsx`

**Role:** The protected admin dashboard. Fetches and displays live visitor statistics.

**`useCallback` hook:**

```jsx
const fetchStats = useCallback(async () => {
  // ... fetch logic
}, [token]);
```

`useCallback` returns a memoized (cached) version of the function. Without it, `fetchStats` would be recreated as a new function reference on every render, which would cause `useEffect` (which depends on it) to re-run on every render — an infinite loop.

The `[token]` dependency means: "only recreate this function if `token` changes."

**Auto-refresh with `setInterval`:**

```jsx
useEffect(() => {
  fetchStats();                               // fetch immediately on mount
  const interval = setInterval(fetchStats, 10000); // then every 10 seconds
  return () => clearInterval(interval);       // cleanup when component unmounts
}, [fetchStats]);
```

The cleanup function (returned from `useEffect`) is called when:
- The component unmounts (user navigates away)
- `fetchStats` changes (e.g., token is refreshed)

Without cleanup, the interval would keep running in the background, calling `fetchStats` on a component that no longer exists — causing memory leaks and React warnings.

**Visit list rendering:**

Each item in `recentVisits` is an object:
```js
{
  timestamp: "2026-03-23T10:00:00.000Z",
  os:        "Windows 10",
  browser:   "Chrome 120",
  country:   "Philippines"
}
```

The JSX renders these as a card with the timestamp on top and three pill chips below (OS, browser, country).

---

### 8.11 `src/index.css`

**Role:** Global stylesheet for the entire application. Imported once in `main.jsx`.

**CSS custom properties (variables):**

```css
:root {
  --primary:    #4f46e5;   /* Indigo */
  --danger:     #dc2626;   /* Red */
  --bg:         #f8fafc;   /* Page background */
  --surface:    #ffffff;   /* Card background */
  --border:     #e2e8f0;   /* Border color */
  --radius:     8px;       /* Consistent border-radius */
}
```

Defining colors as variables means you change a color once in `:root` and it updates everywhere it is used. This is the CSS equivalent of a constant.

**Key CSS concepts used:**

| Concept | Where used | What it does |
|---|---|---|
| `box-sizing: border-box` | `*` | Makes `width`/`height` include padding and border — prevents overflow |
| `display: flex` | `.navbar`, `.visit-item` | Creates a horizontal/vertical flexbox layout |
| `justify-content: space-between` | `.navbar` | Pushes brand to the left, links to the right |
| `display: grid` | `.card-grid`, `.stats-grid` | Creates a responsive multi-column layout |
| `repeat(auto-fit, minmax(260px, 1fr))` | `.card-grid` | Responsive columns: as many as fit, minimum 260px wide |
| `border-radius: 99px` | `.meta-chip`, `.badge-new` | Large value creates a fully-rounded "pill" shape |
| `flex-wrap: wrap` | `.visit-meta` | Chip row wraps to next line on narrow screens |
| `flex-shrink: 0` | `.visit-icon` | Prevents the icon from compressing when space is tight |
| `transition: background .2s` | buttons | Smooth color change on hover over 0.2 seconds |

---

## 9. API Reference

All endpoints are relative to `http://localhost:5000`.

### `POST /api/auth/login`

Authenticates a user and returns a JWT.

**Request body:**
```json
{ "username": "admin", "password": "admin123" }
```

**Success response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "admin", "role": "admin" }
}
```

**Error responses:**
- `400` — missing username or password
- `401` — wrong credentials

---

### `GET /api/auth/me`

Verifies a JWT and returns the decoded user. Requires authentication.

**Request header:**
```
Authorization: Bearer <token>
```

**Success response (200):**
```json
{ "user": { "id": 1, "username": "admin", "role": "admin", "iat": 1234, "exp": 5678 } }
```

**Error responses:**
- `401` — missing, malformed, or expired token

---

### `POST /api/stats/visit`

Records a public page visit. No authentication required.

**Request body:** none required (any body fields are ignored)

**Success response (200):**
```json
{ "message": "Visit recorded" }
```

**Side effects:** increments `totalVisits`; builds a server-side fingerprint from `User-Agent`, IP address, `Accept-Language`, parsed browser, and parsed OS — hashed with SHA-256 and added to the `uniqueVisitors` Set; calls ip-api.com for geolocation; pushes a visit record to `recentVisits`.

---

### `GET /api/stats/visitors`

Returns visitor statistics. Requires authentication.

**Request header:**
```
Authorization: Bearer <token>
```

**Success response (200):**
```json
{
  "totalVisits": 42,
  "uniqueVisitors": 7,
  "recentVisits": [
    {
      "timestamp": "2026-03-23T10:00:00.000Z",
      "os": "Windows 10",
      "browser": "Chrome 120",
      "country": "Philippines"
    }
  ]
}
```

**Error responses:**
- `401` — missing or invalid token

---

## 10. Key Concepts Explained

### ES Modules vs CommonJS

Node.js historically used **CommonJS** (CJS) as its module system. Modern Node.js also supports **ES Modules** (ESM), which is the standard used in browsers and the React frontend. This project uses ESM on the backend.

**Enabling ES Modules on the backend:**
```json
// backend/package.json
{ "type": "module" }
```
This single line tells Node to treat every `.js` file in the package as an ES module.

**Side-by-side comparison:**

| Purpose | CommonJS (old) | ES Module (this project) |
|---|---|---|
| Import a package | `const x = require('pkg')` | `import x from 'pkg'` |
| Import specific exports | `const { a } = require('./file')` | `import { a } from './file.js'` |
| Export one main thing | `module.exports = router` | `export default router` |
| Export multiple things | `module.exports = { a, b }` | `export { a, b }` |
| Local file extension | Optional (auto-resolved) | **Required** (must write `.js`) |
| Top-level `await` | Not allowed | Allowed |
| `__dirname` / `__filename` | Available | Not available (use `import.meta.url`) |

**Why the `.js` extension is mandatory in ESM:**
CommonJS's `require()` tried several extensions automatically (`./file` → `./file.js` → `./file/index.js`). ES modules follow the browser standard, which treats paths literally — `'./routes/auth'` and `'./routes/auth.js'` are two different URLs. Always include `.js` on local imports.

---

### JSON Web Tokens (JWT)

A JWT is a compact, self-contained token with three base64-encoded parts separated by dots:

```
header.payload.signature

eyJhbGciOiJIUzI1NiJ9  .  eyJpZCI6MSwicm9sZSI6ImFkbWluIn0  .  SflKxwRJSMeKKF2QT4fw
     ↑ algorithm              ↑ your data (payload)                   ↑ HMAC signature
```

- **Header** — metadata: algorithm used (`HS256`)
- **Payload** — the data you stored: `{ id, username, role, iat, exp }`
- **Signature** — proves the token hasn't been tampered with; created by hashing header + payload with `JWT_SECRET`

The payload is **base64-encoded, not encrypted** — anyone can decode it. The signature only proves the token came from your server. Never store passwords or sensitive data in the payload.

### bcrypt Password Hashing

bcrypt is a one-way hashing function — you cannot reverse a hash to get the original password.

```
bcrypt.hashSync('admin123', 10)  →  "$2a$10$abc...xyz"
                         ↑
                    cost factor (10 rounds = 2^10 iterations)
```

When a user logs in, bcrypt hashes their submitted password the same way and compares the two hashes. A match means the password is correct.

The cost factor (10) makes each hash take ~100ms of CPU time. This is intentional — it makes brute-force attacks impractically slow.

### React Context vs Props

| | Props | Context |
|---|---|---|
| **How to pass data** | Parent explicitly passes to child | Any descendant reads directly |
| **Best for** | Component-specific data | App-wide shared state (auth, theme) |
| **Problem** | Prop drilling through many levels | Harder to trace where data comes from |

### `async` / `await`

JavaScript is single-threaded. Network requests (like `fetch`) are non-blocking — they don't stop the script while waiting. `async/await` is syntactic sugar over Promises that makes async code look like sequential code:

```js
// Without async/await (Promise chaining)
fetch('/api/auth/login')
  .then(res => res.json())
  .then(data => login(data.user, data.token))
  .catch(err => setError(err.message));

// With async/await (same logic, easier to read)
const res  = await fetch('/api/auth/login');
const data = await res.json();
login(data.user, data.token);
```

### React Hooks Quick Reference

| Hook | Purpose | Used in |
|---|---|---|
| `useState(initial)` | Stores a value that triggers re-render when changed | All components |
| `useEffect(fn, deps)` | Runs side-effects after render | AuthContext, PublicPage, AdminPage |
| `useContext(ctx)` | Reads a React Context value | `useAuth()` custom hook |
| `useCallback(fn, deps)` | Memoizes a function (stable reference) | AdminPage |
| `useNavigate()` | Returns a navigation function (React Router) | Navbar, LoginPage |

### `Set` for Unique Visitors

A JavaScript `Set` is a collection that only stores **unique values**:

```js
const s = new Set();
s.add('abc');  // Set { 'abc' }
s.add('xyz');  // Set { 'abc', 'xyz' }
s.add('abc');  // Set { 'abc', 'xyz' }  ← duplicate ignored
s.size;        // 2
```

This makes counting unique visitors trivial — call `uniqueVisitors.add(visitorId)` on every visit and the Set handles deduplication automatically.

---

## 11. npm Packages Reference

### `express`
Web framework for Node.js. Provides `app.use()`, `app.get()`, `app.post()`, routing, and middleware.

### `cors`
Middleware that adds `Access-Control-Allow-Origin` headers to responses, telling browsers it is safe to receive responses from a different origin (port).

### `jsonwebtoken`
- `jwt.sign(payload, secret, options)` — creates a signed JWT string
- `jwt.verify(token, secret, callback)` — validates and decodes a JWT

### `bcryptjs`
- `bcrypt.hashSync(password, costFactor)` — synchronous hash (use only at startup for seeding)
- `bcrypt.compare(plain, hash)` — async comparison, returns a Promise\<boolean\>

### `ua-parser-js`
Parses the `User-Agent` HTTP header into structured data:
```js
const parser = new UAParser('Mozilla/5.0 (Windows NT 10.0...)');
parser.getOS();       // { name: 'Windows', version: '10' }
parser.getBrowser();  // { name: 'Chrome', major: '120', version: '120.0.0.0' }
```

### `react-router-dom`
Client-side routing library for React.
- `BrowserRouter` — enables History API routing
- `Routes` / `Route` — declare URL-to-component mappings
- `Link` — renders an `<a>` that navigates without page reload
- `Navigate` — programmatic redirect component
- `useNavigate()` — hook that returns a navigate function
- `useParams()` — reads dynamic URL parameters (`:id`)

### `vite`
Build tool and dev server. Key features used:
- Fast cold-start (uses native ES modules)
- Hot Module Replacement (HMR) — updates components without full reload
- Dev proxy — forwards `/api/*` requests to the backend

---

## 12. Security Notes

This project is designed for **learning purposes**. Before using in production, address the following:

| Issue | Current state | Production fix |
|---|---|---|
| JWT secret | Hard-coded string | Move to `process.env.JWT_SECRET` — a long random string (32+ chars) |
| User store | In-memory array | Replace with a real database (PostgreSQL, MongoDB, etc.) |
| Visitor data | In-memory — lost on restart | Persist to a database |
| Password storage | bcrypt hashed ✅ | Already correct |
| CORS origin | Hardcoded `localhost:5173` | Replace with your actual production domain |
| JWT expiry | 8 hours ✅ | Reasonable for a web app |
| HTTPS | Not configured | Use TLS in production (nginx, a cloud provider, or Let's Encrypt) |
| Input validation | Minimal | Add a validation library (e.g., `zod`, `express-validator`) |
| Rate limiting | None | Add `express-rate-limit` to the login endpoint to prevent brute-force |
