# Micro-Portfolio API

A backend service for a Linktree-style "link-in-bio" builder. Users sign up, customize a public profile (bio, avatar, theme), and manage a list of links — visitors hit a cached public page and clicks are tracked per link.

Built to demonstrate practical backend concerns beyond basic CRUD: **Redis caching on a read-heavy path, cache invalidation, rate limiting, and non-blocking click tracking.**

## Features

- JWT authentication (register/login)
- Public profile with custom slug, bio, avatar, and theme
- Full CRUD on bio links, with drag-and-drop reordering
- **Redis-cached public profile page** — cache-aside pattern with TTL, invalidated on any profile/link update
- **Click tracking** via a redirect endpoint that logs a click asynchronously without blocking the redirect
- **Rate limiting** — stricter limits on auth endpoints (brute-force protection), lighter limits on public endpoints
- Centralized error handling (validation errors, duplicate keys, invalid ObjectIds)
- Dockerized with `docker-compose` (API + MongoDB + Redis)

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Redis (via `ioredis`) — caching + can back rate limiting
- JWT + bcrypt for auth
- Docker / docker-compose

## Project Structure

```
src/
  config/       # db.js, redis.js - connection setup
  models/       # User, Link
  controllers/  # auth, profile, link, public
  routes/       # auth, profile, links, public, redirect
  middlewares/  # auth (JWT), rateLimiter, errorHandler
  utils/        # generateToken, generateSlug
  app.js        # express app + route mounting
server.js        # entry point
```

## Getting Started

### 1. Clone and install
```bash
git clone <your-repo-url>
cd micro-portfolio-api
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# edit .env - set MONGO_URI, JWT_SECRET, REDIS_URL
```

### 3. Run with Docker (recommended - spins up Mongo + Redis too)
```bash
docker-compose up --build
```

### 4. Or run locally (requires local MongoDB + Redis running)
```bash
npm run dev
```

API runs at `http://localhost:5000`.

## API Reference

### Auth
| Method | Endpoint             | Access  | Description              |
|--------|-----------------------|---------|---------------------------|
| POST   | `/api/auth/register`  | Public  | Create account            |
| POST   | `/api/auth/login`     | Public  | Login, returns JWT        |
| GET    | `/api/auth/me`        | Private | Get logged-in user        |

### Profile
| Method | Endpoint                        | Access  | Description                          |
|--------|----------------------------------|---------|----------------------------------------|
| GET    | `/api/profile/me`               | Private | Get own profile                        |
| PUT    | `/api/profile/me`                | Private | Update bio/theme/avatar/slug/isPublic  |
| POST   | `/api/profile/me/regenerate-slug`| Private | Get a fresh random slug                |

### Links
| Method | Endpoint            | Access  | Description                     |
|--------|----------------------|---------|-----------------------------------|
| GET    | `/api/links`         | Private | List own links                    |
| POST   | `/api/links`          | Private | Add a link                        |
| PUT    | `/api/links/:id`      | Private | Update a link                     |
| DELETE | `/api/links/:id`      | Private | Delete a link                     |
| PUT    | `/api/links/reorder`  | Private | Reorder links (`{ order: [id,...] }`) |

### Public
| Method | Endpoint              | Access | Description                                   |
|--------|------------------------|--------|-------------------------------------------------|
| GET    | `/api/public/:slug`    | Public | Get a user's public profile + links (**cached**) |
| GET    | `/api/r/:linkId`       | Public | Redirect to link's URL, increments click count  |

### Example: Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Deva","email":"deva@example.com","password":"secret123"}'
```

### Example: Add a link (with JWT)
```bash
curl -X POST http://localhost:5000/api/links \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"GitHub","url":"https://github.com/yourname","icon":"github"}'
```

### Example: View public page
```bash
curl http://localhost:5000/api/public/deva
```

## Design Notes (talking points for interviews)

- **Cache-aside pattern**: public profile reads check Redis first; on a miss, MongoDB is queried and the result is cached with a TTL. Any write (profile update, link CRUD, reorder) explicitly `DEL`s the cache key so stale data is never served longer than necessary.
- **Non-blocking click tracking**: the redirect handler sends the `302` response immediately and increments the click counter afterward, so visitors aren't delayed by a write they don't care about.
- **Rate limiting tiers**: auth endpoints get a tight window (brute-force protection), public endpoints get a looser one (scraping/abuse protection) — these are separate `express-rate-limit` instances, not one-size-fits-all.
- **Scoped queries everywhere**: link mutations always filter by `{ _id, user: req.user._id }` so one user can never read or modify another user's links, even by guessing an ID.

## Possible Extensions
- Avatar upload via S3/Cloudinary instead of raw URL
- Per-link analytics (clicks over time, not just a running total)
- Public profile view count
- Custom domains per user

## License
MIT
