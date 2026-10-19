# Real platform data integration — status

**Date:** 2026-10-19  
**Status:** **Blocked** — safe UI cleanup done; live platform connection **not** implemented.

## What EduAdmin uses today

| Layer | Source |
| --- | --- |
| Frontend lists/charts | Real HTTP calls to EduAdmin `/api/v1/*` (no mock chart arrays) |
| Backend | SQL against the MySQL named in `backend/.env` (`DB_*`) |
| Local content | Docker MySQL `eduadmin` + optional `npm run db:seed` sample rows |

Dashboard metrics are **not** hardcoded in React. They reflect whatever is in the connected MySQL database (currently the local EduAdmin DB unless `DB_*` is changed).

## Nearby platform clone (inspected, not connected)

A clone exists at `/home/tashee/Desktop/ai-school-platform` (AI-School). From **public** docs/config templates only:

- Stack: Django API + **PostgreSQL** (not MySQL)
- Local compose exposes Postgres (documented env names such as `DATABASE_URL`, `DATABASE_NAME`, etc.)
- API docs path documented as `http://127.0.0.1:8000/api/docs/` when that app runs

**No approved credentials, schema mapping, or integration method were provided for EduAdmin.**  
EduAdmin’s `mysql2` pool and SQL assume EduAdmin’s MySQL schema (`users`, `courses`, `enrollments`, `progress`, …). Pointing it at AI-School Postgres is **not** a drop-in change and was **not** done.

UniHub also exists under Documents/Desktop; EduAdmin docs previously treated EduAdmin as **standalone**, not an extension of UniHub.

## Safe changes completed (this pass)

- Removed login-page demo credential panel from `frontend/src/pages/LoginPage.jsx`
- Clarified dashboard copy so it does not claim an external “platform database”
- Seed scripts **retained** for local/test (not deleted)
- Local `DB_*` / Docker MySQL **unchanged**
- No connection to AI-School DB or API
- No destructive scripts run against any platform database

## Blockers (need project owner)

1. Confirm which product is “the existing educational platform” (AI-School, UniHub, other).
2. Approved integration method: **HTTP API** vs **read-only DB** vs **ETL into EduAdmin MySQL**.
3. If API: base URL, auth scheme, admin endpoints for students/courses/enrollments/progress.
4. If DB: engine (Postgres vs MySQL), schema docs, **read-only** user, approval to connect.
5. Write policy: read-only dashboard vs allowed mutations (EduAdmin currently has many write routes).
6. Explicit approval before any `DB_*` change or new platform client code.

## Security note

Do **not** point EduAdmin’s current write-enabled MySQL pool at a live platform database. Do **not** run `npm run db:seed` against a platform database (schema seed drops tables).
