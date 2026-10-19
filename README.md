# EduAdmin

Standalone administration dashboard for an online learning platform. Authorized administrators manage students, courses, enrollments, and learning progress, and review live dashboard and report analytics from one place.

## Features

- JWT authentication for administrators and registered students, with separate areas for each role
- Dashboard with live totals, enrollment trends, and recent activity
- Student list, search, status filters, and profile updates
- Course catalog with create / publish / unpublish (soft archive)
- Enrollment create, status updates, and soft withdraw
- Learning progress listing (stored enrollment-level percentages)
- Reports and analytics with date/course filters and CSV export
- Super-admin administrator management

## Technology stack

| Layer | Stack |
| --- | --- |
| Frontend | React 18, Vite, React Router, Tailwind CSS |
| Backend | Node.js 20+, Express, Zod, JWT, bcrypt, Helmet |
| Database | MySQL 8.4 (Docker Compose) |
| Tests | Node.js built-in test runner; Postman / Newman |

There is **no Swagger/OpenAPI UI**. API contracts are documented in [`docs/API.md`](docs/API.md) and exercised by [`postman/`](postman/).

## Prerequisites

- Node.js **20+**
- npm
- Docker and Docker Compose (for MySQL)

## Installation

```bash
# 1. Install dependencies (root, backend, frontend)
npm run setup

# 2. Configure the API environment
cp backend/.env.example backend/.env
# Edit JWT_SECRET to a long random string before any shared or non-local use.

# 3. Start local MySQL (optional: seed sample rows for local/dev only)
npm run db:up
npm run db:seed

# 4. Start API + web together
npm run dev
```

- Web UI: http://localhost:5173 (Vite may choose 5174/5175 if the port is busy)
- API: http://localhost:4000 (`/api/v1`, proxied from the Vite app as `/api`)

### Environment variables

Safe template: [`backend/.env.example`](backend/.env.example) (also mirrored at [`.env.example`](.env.example)).

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default `4000`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET` | Signing secret (min 16 characters) |
| `JWT_EXPIRES_IN` | Token lifetime (default `8h`) |
| `CLIENT_ORIGIN` | Allowed CORS origin (Vite URL) |

Never commit `backend/.env`. Docker Compose uses local-only MySQL credentials defined in `docker-compose.yml` for development.

### Database

`npm run db:seed` applies `backend/db/schema.sql` and loads demo users, courses, enrollments, and progress. Re-running seed **rebuilds** the local database contents (development only).

## Scripts

| Command | Description |
| --- | --- |
| `npm run setup` | Install root, backend, and frontend packages |
| `npm run db:up` | Start MySQL via Docker Compose |
| `npm run db:seed` | Apply schema and seed data |
| `npm run dev` | API (`--watch`) + Vite together |
| `npm run dev:api` | API only |
| `npm run dev:web` | Frontend only |
| `npm test` | Backend API integration tests |
| `npm run build` | Frontend production build |

## Testing

```bash
# Requires MySQL up and seeded
npm test
```

Postman:

1. Import `postman/EduAdmin_API_Testing.postman_collection.json`
2. Import `postman/EduAdmin_Local.postman_environment.json`
3. Select **EduAdmin Local**, set `adminPassword` / `studentPassword` from the local seed accounts (see below)
4. Run **Authentication → Login (admin)** first

Newman CLI details: [`postman/README.md`](postman/README.md).

## Local development seed accounts

Created only by `npm run db:seed` for **local MySQL / automated tests**. They are **not** real platform identities, and credentials are **not** shown in the login UI.

| Role | Email (seed) |
| --- | --- |
| Super admin | `super@eduadmin.test` |

Passwords are defined in `backend/db/seed.js`. Student seed accounts cannot open the admin dashboard.

Connecting EduAdmin to an external educational platform (API or database) is **not configured** until the project owner provides access and approves the method. See [`docs/REAL_DATA_INTEGRATION_STATUS.md`](docs/REAL_DATA_INTEGRATION_STATUS.md).

## Documentation

| Document | Purpose |
| --- | --- |
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | How administrators use the UI |
| [`docs/API.md`](docs/API.md) | HTTP API overview |
| [`docs/FINAL_PROJECT_REVIEW.md`](docs/FINAL_PROJECT_REVIEW.md) | Delivery review |
| [`docs/FINAL_QA_SUMMARY.md`](docs/FINAL_QA_SUMMARY.md) | QA summary |
| [`docs/PHASE_9_QA_REPORT.md`](docs/PHASE_9_QA_REPORT.md) | Phase 9 detailed QA |
| [`docs/PHASE_3_DATABASE_API_DESIGN.md`](docs/PHASE_3_DATABASE_API_DESIGN.md) | Approved DB / API design |

## Project layout

```
EduAdmin/
  backend/          Express API, Zod schemas, MySQL services, tests
  frontend/         React admin UI
  postman/          Collection + local environment template
  docs/             Guides, phase notes, delivery reports
  docker-compose.yml
```

## Known limitations

- Progress is an enrollment-level `percent` value; there is no lesson/module tracking.
- Students register themselves. Administrators can still update an existing student, and only an administrator can create an enrollment.
- Course delete and enrollment delete are soft (unpublish / withdraw), not hard deletes.
- No ESLint/TypeScript frontend lint or frontend unit-test suite is configured.
- Login is rate-limited (20 attempts / 15 minutes) outside `NODE_ENV=test`.
- Source is published at https://github.com/tasheayansa6/EduAdmin. Local `backend/.env` stays on the machine and is not in the repository.
