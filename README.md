# 🌦️ Weather Middleware API

A small, production-style **Node.js + Express + TypeScript** service that fetches current
weather for 5 cities from [OpenWeatherMap](https://openweathermap.org/), reformats it into a
clean flat shape, **caches it in memory**, and re-serves it through simple endpoints your other
tools can consume.

It refreshes the data **on startup and every 30 minutes**. If OpenWeatherMap is ever
unreachable, it keeps serving the last good data and flags it with `"stale": true` so consumers
always get an answer.

**Tracked cities:** Oslo · Lisbon · Nairobi · Osaka · Medellín

---

## Table of contents

1. [What you need first (prerequisites)](#1-what-you-need-first-prerequisites)
2. [Install & run in 4 steps](#2-install--run-in-4-steps)
3. [🔑 How to get and swap the API key (step-by-step)](#3--how-to-get-and-swap-the-api-key-step-by-step)
4. [Available npm scripts](#4-available-npm-scripts)
5. [API endpoints](#5-api-endpoints)
6. [Copy-paste `curl` examples](#6-copy-paste-curl-examples)
7. [Configuration (environment variables)](#7-configuration-environment-variables)
8. [How it works (caching, stale data, rate limiting)](#8-how-it-works-caching-stale-data-rate-limiting)
9. [Project structure](#9-project-structure)
10. [Deployment](#10-deployment)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. What you need first (prerequisites)

- **Node.js 18 or newer** (this was built and tested on Node 22).
  Check your version with:
  ```bash
  node --version
  ```
  If you don't have Node, download it from <https://nodejs.org/> (the "LTS" version is fine).
- That's it. No database, no Docker, nothing else to install.

---

## 2. Install & run in 4 steps

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file from the example
cp .env.example .env

# 3. Put your API key inside .env  (see Section 3 below for exactly how)

# 4. Start the server in development mode
npm run dev
```

When it starts you'll see:

```
[...] [INFO] Performing initial weather fetch...
[...] [INFO] Weather refresh complete: 5/5 succeeded, 0 failed
[...] [INFO] 🌦️  Weather Middleware API listening on http://localhost:3000
```

Now open <http://localhost:3000/weather> in your browser. 🎉

> **For production** (compiled JavaScript instead of on-the-fly TypeScript):
> ```bash
> npm run build   # compiles to ./dist
> npm start       # runs ./dist/server.js
> ```

---

## 3. 🔑 How to get and swap the API key (step-by-step)

This API uses **OpenWeatherMap's free plan**. If you've never set up an API key before, follow
this exactly — it takes about 3 minutes.

### Step A — Create a free account
1. Go to <https://home.openweathermap.org/users/sign_up>.
2. Sign up with your email and confirm it.

### Step B — Copy your API key
1. Log in, then open the **API keys** page: <https://home.openweathermap.org/api_keys>.
2. You'll see a long string of letters and numbers under the **Key** column — for example:
   ```
   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   That whole string **is your API key**. Click the copy icon next to it.

### Step C — Paste the key into the project
1. In the project folder, find the file named **`.env`**.
   (If it doesn't exist yet, create it by copying `.env.example` → see Step 2 above.)
2. Open `.env` in any text editor. Find this line:
   ```env
   OPENWEATHER_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with the key you copied, so it looks like:
   ```env
   OPENWEATHER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. **Save the file.** Done — that is the *only* place the key lives.

### Step D — Restart the server
Stop the server (press `Ctrl + C` in the terminal) and start it again with `npm run dev`.
The key is now active.

> ### ⏳ Important: brand-new keys take time to activate
> When you first create an OpenWeatherMap key, their dashboard shows it as **"Active"**
> immediately — **but the key can take up to ~2 hours to actually start working.** Until then,
> every request returns:
> ```json
> {"cod":401, "message": "Invalid API key. ..."}
> ```
> This is **normal** and is **not** a bug in this project. Just wait a bit and try again.
> In the meantime, the API still runs — it simply serves no data until the key goes live.

### 🔁 To swap in a *different* key later
Just edit that same `OPENWEATHER_API_KEY=` line in `.env`, save, and restart. **Nothing else in
the code needs to change** — the key is never hard-coded anywhere.

> 🔒 **Security note:** `.env` is listed in `.gitignore`, so your real key is **never committed**
> to version control. Only `.env.example` (with a placeholder) is shared. Keep it that way.

---

## 4. Available npm scripts

| Script              | What it does                                                        |
| ------------------- | ------------------------------------------------------------------- |
| `npm run dev`       | Start in watch mode (auto-restarts on file changes). Best for dev.  |
| `npm run build`     | Compile TypeScript → JavaScript into `./dist`.                      |
| `npm start`         | Run the compiled app from `./dist` (use after `npm run build`).     |
| `npm run typecheck` | Type-check the whole project without emitting files.                |
| `npm run lint`      | Run ESLint over `src/`.                                             |
| `npm run lint:fix`  | Run ESLint and auto-fix what it can.                                |
| `npm run format`    | Format the code with Prettier.                                      |

---

## 5. API endpoints

Base URL (local): `http://localhost:3000`

Every response uses a consistent envelope:

```json
{ "success": true, "data": { ... }, "message": "…", "meta": { ... } }
```

…and errors use:

```json
{ "success": false, "error": { "code": "…", "message": "…", "details": { ... } } }
```

| Method | Path                                  | Description                                              | Params / Query                     | Success code |
| ------ | ------------------------------------- | -------------------------------------------------------- | ---------------------------------- | ------------ |
| `GET`  | `/`                                   | API welcome + endpoint list                              | —                                  | `200`        |
| `GET`  | `/weather`                            | Current weather for **all 5** cities                     | —                                  | `200`        |
| `GET`  | `/weather/:city`                      | Current weather for **one** city                         | `:city` (e.g. `Oslo`, `medellin`)  | `200`        |
| `GET`  | `/weather/compare?cities=cityA,cityB` | Side-by-side comparison of **two** cities, with deltas   | `cities` = two names, comma-sep    | `200`        |
| `GET`  | `/health`                             | Uptime + last successful fetch time + cache size         | —                                  | `200`        |

**Notes**

- City lookup is **case- and accent-insensitive**: `Medellín`, `medellin`, and `MEDELLIN` all work.
- No request body is needed for any endpoint (all `GET`).
- Unknown cities return **404**; malformed `compare` queries return **422**; unmatched routes return **404**.

### Weather object fields (flat — no nesting)

| Field          | Type     | Example                  | Notes                                          |
| -------------- | -------- | ------------------------ | ---------------------------------------------- |
| `city`         | string   | `"Oslo"`                 | Canonical display name                         |
| `country`      | string   | `"NO"`                   | ISO country code                               |
| `temperatureC` | number   | `12.5`                   | Degrees Celsius                                |
| `temperatureF` | number   | `54.6`                   | Degrees Fahrenheit                             |
| `humidity`     | number   | `65`                     | Percent                                        |
| `windSpeed`    | number   | `3.2`                    | Metres per second                              |
| `condition`    | string   | `"Cloudy"`               | One of `Sunny` / `Cloudy` / `Rainy` / `Snowy`  |
| `description`  | string   | `"broken clouds"`        | Raw OpenWeatherMap text                        |
| `weatherCode`  | number   | `803`                    | Raw OpenWeatherMap condition code              |
| `lastFetch`    | string   | `"2026-05-24T00:36:..Z"` | ISO 8601 timestamp of last successful fetch    |
| `stale`        | boolean  | `false`                  | `true` if served from cache while API was down |

The **condition label** is derived from the OpenWeatherMap code:
`2xx/3xx/5xx → Rainy`, `6xx → Snowy`, `800 → Sunny`, `7xx/80x → Cloudy`.

---

## 6. Copy-paste `curl` examples

> Replace `3000` with your port if you changed it. Add `| python3 -m json.tool` (or `| jq`) at
> the end of any command to pretty-print the JSON.

**Get all cities**
```bash
curl http://localhost:3000/weather
```

**Get one city** (try with and without the accent)
```bash
curl http://localhost:3000/weather/Oslo
curl http://localhost:3000/weather/medellin
```

**Compare two cities** (includes temperature & humidity differences)
```bash
curl "http://localhost:3000/weather/compare?cities=Oslo,Osaka"
```
Example `comparison` block in the response:
```json
"comparison": {
  "temperatureDifferenceC": 11.3,
  "temperatureDifferenceF": 20.2,
  "humidityDifference": 12,
  "windSpeedDifference": 4,
  "warmerCity": "Osaka",
  "moreHumidCity": "Oslo",
  "windierCity": "Osaka"
}
```

**Health check**
```bash
curl http://localhost:3000/health
```

**Error examples**
```bash
# Unknown city -> 404
curl http://localhost:3000/weather/Atlantis

# Only one city given to compare -> 422
curl "http://localhost:3000/weather/compare?cities=Oslo"

# Same city twice -> 422
curl "http://localhost:3000/weather/compare?cities=Oslo,oslo"
```

---

## 7. Configuration (environment variables)

All configuration lives in `.env` (copied from `.env.example`). Values are validated at startup —
if something required is missing, the app prints a clear message and exits.

| Variable               | Required | Default                                    | Description                                |
| ---------------------- | -------- | ------------------------------------------ | ------------------------------------------ |
| `OPENWEATHER_API_KEY`  | **Yes**  | —                                          | Your OpenWeatherMap key (see Section 3).   |
| `PORT`                 | No       | `3000`                                     | HTTP port to listen on.                    |
| `NODE_ENV`             | No       | `development`                              | `development` / `production` / `test`.     |
| `OPENWEATHER_BASE_URL` | No       | `https://api.openweathermap.org/data/2.5`  | Upstream base URL.                         |
| `WEATHER_REFRESH_CRON` | No       | `*/30 * * * *`                             | Refresh schedule (cron). Default = 30 min. |
| `REQUEST_TIMEOUT_MS`   | No       | `8000`                                     | Abort an upstream request after this long. |
| `RATE_LIMIT_MAX`       | No       | `30`                                       | Max requests per IP per window.            |
| `RATE_LIMIT_WINDOW_MS` | No       | `60000`                                    | Rate-limit window in ms (default 60s).     |

**Changing which cities are tracked:** edit the list in
[`src/config/cities.ts`](src/config/cities.ts). No other code changes are needed.

---

## 8. How it works (caching, stale data, rate limiting)

- **On startup** the service fetches all 5 cities once, so data is warm immediately.
- **Every 30 minutes** (configurable) a [scheduled job](src/jobs/weatherRefresh.job.ts) refreshes
  the cache in the background.
- Data is held in a simple **in-memory cache** (a `Map`), exposed behind a repository interface so
  it could later be swapped for Redis/a database without touching business logic.
- **Stale fallback:** if a city's fetch fails (e.g. OpenWeatherMap is down or the key isn't active
  yet), the service keeps the previous value and marks it `"stale": true`. The list endpoint also
  reports an overall `meta.stale` flag.
- **Rate limiting:** each IP is limited to **30 requests per 60 seconds** (configurable). Exceeding
  it returns `429` with a clear message.
- **Security & hygiene:** `helmet` (secure headers), `cors`, `compression`, request logging with
  `morgan`, and centralized error handling are all wired in.

---

## 9. Project structure

A layered "clean architecture" — HTTP, business logic, and data access are kept separate, so each
piece is easy to test and replace.

```
src/
├── app.ts                  # Express app + dependency wiring (no app.listen)
├── server.ts               # Entry point: boot, initial fetch, schedule, listen, shutdown
├── config/
│   ├── env.ts              # Loads & validates env vars with Zod -> typed `config`
│   └── cities.ts           # The 5 hardcoded cities
├── jobs/
│   └── weatherRefresh.job.ts   # 30-minute cron refresh
├── modules/
│   ├── weather/
│   │   ├── weather.controller.ts   # HTTP layer (req/res only)
│   │   ├── weather.service.ts      # Business logic (fetch, cache, compare, stale)
│   │   ├── weather.repository.ts   # In-memory cache behind an interface
│   │   ├── weather.provider.ts     # OpenWeatherMap client (validated with Zod)
│   │   ├── weather.mapper.ts       # Raw API -> flat domain object
│   │   ├── weather.routes.ts       # Route definitions
│   │   ├── weather.validator.ts    # Zod input validation
│   │   ├── weather.dto.ts          # Response shapes
│   │   └── weather.types.ts        # Domain types
│   └── health/
│       ├── health.controller.ts
│       ├── health.service.ts
│       ├── health.routes.ts
│       └── health.types.ts
└── shared/
    ├── errors/             # AppError + NotFound/BadRequest/Validation/Conflict/ServiceUnavailable
    ├── middlewares/        # errorHandler, notFound, requestLogger, rateLimiter
    ├── types/              # ApiResponse envelope types
    └── utils/              # logger, response builder, temperature/condition helpers
```

---

## 10. Deployment

This is a normal long-running Node server, so any host that runs Node works. General steps for
most platforms (Render, Railway, Fly.io, a VPS, etc.):

1. Push the code to the host (or connect your Git repo).
2. Set the **build command** to: `npm install && npm run build`
3. Set the **start command** to: `npm start`
4. Add the environment variables from Section 7 in the host's dashboard — **most importantly
   `OPENWEATHER_API_KEY`** (don't upload your `.env` file; set it in the dashboard instead).
5. Make sure the host uses the `PORT` it provides (this app already reads `process.env.PORT`).

> **Note on static hosts:** GitHub Pages and the static side of Netlify only serve static files —
> they **cannot** run this Node server. Use a host that runs Node processes (Render and Railway
> both have free tiers and keep the 30-minute refresh job alive).

---

## 11. Troubleshooting

| Symptom                                              | Cause & fix                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `{"cod":401,"message":"Invalid API key..."}` in logs | Key not active yet (wait up to ~2h) **or** wrong key in `.env`. See Section 3.              |
| App exits at startup with "Invalid environment…"     | A required env var is missing/invalid. The message lists exactly which one. Check `.env`.   |
| `/weather` returns an empty list                     | First fetch hasn't succeeded yet (often the 401 activation delay). Retry once the key works.|
| A city shows `"stale": true`                         | OpenWeatherMap was unreachable for that city; you're seeing the last good cached value.     |
| `429 Too Many Requests`                              | You hit the rate limit (30/min by default). Raise `RATE_LIMIT_MAX` in `.env` if needed.     |

---

Built with Express, TypeScript (strict mode), and Zod. No authentication layer, by design.
