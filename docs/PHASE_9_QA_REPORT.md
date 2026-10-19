# Phase 9 — QA, Integration Testing, and Postman

## Environment and setup

| Item | Value |
| --- | --- |
| App | EduAdmin monorepo (`frontend` + `backend`) |
| API | `http://127.0.0.1:4000` (`/api/v1`) |
| Web | Vite proxy `/api` → API (observed on port **5175** when 5173/5174 busy) |
| Database | Local MySQL via Docker (`npm run db:up`, `npm run db:seed`) |
| Auth | JWT Bearer; admin / super_admin only |
| Automated tests | Node.js built-in test runner (`node --test`) |
| Manual API | Postman collection + Newman |

Commands used:

```bash
npm test                 # backend integration tests (NODE_ENV=test, concurrency 1)
npm run build --prefix frontend
npx newman run postman/EduAdmin_API_Testing.postman_collection.json \
  -e postman/EduAdmin_Local.postman_environment.json \
  --env-var "adminPassword=<local-demo>" \
  --env-var "studentPassword=<local-demo>"
```

Passwords were **not** committed; Newman received them only via `--env-var`.

---

## API endpoints tested

| Area | Methods / routes | Result |
| --- | --- | --- |
| Health | `GET /api/health`, `GET /api/v1/health` | Passed |
| Auth | `POST /login`, `GET/PATCH /me`, `POST /logout` | Passed |
| Dashboard | `GET /dashboard` | Passed |
| Students | `GET /`, `GET /:id`, `PATCH /:id` | Passed (no hard delete; soft status only) |
| Courses | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` (unpublish) | Passed |
| Enrollments | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` (withdraw) | Passed |
| Progress | `GET /progress` | Passed |
| Reports | `GET /reports`, `GET /reports/export` | Passed |
| Lookups | `GET /lookups` | Passed |
| Administrators | `GET/POST/PATCH` (super_admin) | Passed (admin → 403) |

Student **creation** is not part of the deployed admin API (students come from seed / platform accounts). Updates and archival via `status` are supported.

---

## Postman collection

| Artifact | Path |
| --- | --- |
| Collection | `postman/EduAdmin_API_Testing.postman_collection.json` |
| Environment | `postman/EduAdmin_Local.postman_environment.json` |
| Instructions | `postman/README.md` |

Folders: Health Check, Authentication, Dashboard, Students, Courses, Enrollments, Learning Progress, Reports and Analytics, Negative and Authorization Tests.

### Newman result (executed)

| Metric | Value |
| --- | --- |
| Requests | 32 |
| Assertions | **46 passed / 0 failed** |
| Duration | ~5s |

Initial Newman failures (empty `token` env overriding collection variable; logout `await` in prerequest) were fixed in the collection before the successful run.

---

## Automated test results

| Suite file | Focus | Result |
| --- | --- | --- |
| `backend/tests/api.test.js` | Auth, authorization, enrollments, progress, reports, courses | Passed |
| `backend/tests/phase9.qa.test.js` | Health, validation, students, integrity, escalation, aggregates | Passed |
| **Total** | **57 tests** | **57 passed / 0 failed** |

Frontend production build: **passed**.

---

## Authentication and authorization

| Scenario | Status |
| --- | --- |
| Valid admin login | Passed |
| Invalid / unknown credentials (generic 401) | Passed |
| Student login blocked (403) | Passed |
| Missing / malformed token (401) | Passed |
| Logout invalidates token | Passed |
| Inactive admin token rejected | Passed |
| Admin cannot manage administrators (403) | Passed |
| Super admin can list administrators | Passed |
| Role escalation via `PATCH /auth/me` ignored | Passed |
| Backend enforces auth (not only frontend guards) | Passed |

---

## Data integrity

| Check | Status |
| --- | --- |
| Duplicate active enrollment → 409 | Passed |
| Nonexistent student/course enrollment → 400 | Passed |
| Draft course enrollment rejected | Passed |
| Inactive student enrollment rejected | Passed |
| Course DELETE unpublishes (row retained) | Passed |
| Enrollment DELETE withdraws (row retained) | Passed |
| Progress preserved on re-enrollment after withdraw | Passed (by design) |
| Dashboard totals match SQL counts | Passed |
| Unfiltered report enrollments match non-withdrawn count | Passed |
| Duplicate student email → 409 | Passed |

---

## Input validation and errors

| Case | Expected | Status |
| --- | --- | --- |
| Malformed JSON | 400, no stack | Passed |
| `limit > 50`, `page < 1` | 400 | Passed |
| Invalid email / status | 400 | Passed |
| Invalid report dates / `from > to` | 400 | Passed |
| Empty course create | 400 + field errors | Passed |
| Unknown route | 404 safe message | Passed |
| Missing resources | 404 | Passed |
| 500 responses | Generic message only | Passed (handler verified; no intentional DB crash injected) |

---

## Responsive UI checks

Performed with Cursor browser against `http://localhost:5175` (API on `:4000`).

| Check | Result |
| --- | --- |
| Login form | Passed |
| Dashboard loads live totals (students/courses/enrollments/progress) | Passed |
| Navigation to Reports | Passed (filters, CSV control, course select) |
| Students page with search/status filters | Passed (table populated) |
| Mobile viewport (~390×844) | Menu control present; **no horizontal overflow** on Reports |
| Profile menu / logout UI | Present (logout API covered by automated/Postman tests) |
| Tablet viewport | Not separately automated |
| Console error audit | Not fully instrumented (not tested) |

---

## Regression

| Area | Result |
| --- | --- |
| Existing auth / JWT session_version | Passed |
| Soft withdraw / unpublish contracts | Passed |
| Dashboard + reports aggregates | Passed |
| Frontend build | Passed |
| Test isolation | Fixed: `--test-concurrency=1` so inactive-admin mutation cannot race other files |

---

## Bugs found and fixes applied

| Severity | Issue | Resolution |
| --- | --- | --- |
| **High** | Parallel test files raced on shared admin `status=inactive`, causing intermittent 401s | `npm test` now uses `--test-concurrency=1` |
| **Medium** | Postman env empty `token` overrode collection token → all authed Newman requests 401 | Login script sets env + collection token; blank `token` removed from env template |
| **Medium** | Enrollment create test assumed `percent === 0` always; re-activated withdrawn enrollments preserve progress | Assertion updated; service comment documents intentional preservation |
| **Low** | Newman logout prerequest used invalid top-level `await` | Rewrote with nested `pm.sendRequest` callbacks |
| **Low** | Automated/Postman course creates leave draft rows in local DB | Isolated titles; soft-unpublish only — document as local seed noise |

No critical security defects found in Phase 9 review. Authorization remains enforced server-side.

---

## Tests not run / blocked

| Item | Why |
| --- | --- |
| Forced 500 via DB outage | Avoided destructive DB stop against the shared local instance |
| Exhaustive a11y audit / axe | Out of scope tooling |
| Full tablet matrix screenshots | Desktop + one mobile viewport covered |
| Production / remote environments | Local Docker only by design |

---

## Remaining risks

1. **Login rate limit (20 / 15 min)** can block manual + Newman logins when hammering `/auth/login` against a long-lived API process. Tests skip the limiter under `NODE_ENV=test`.
2. **Local DB accumulates draft QA courses** from repeated test/Postman runs; re-seed (`npm run db:seed`) resets when desired.
3. **No student-create API** — student onboarding remains outside this admin surface.
4. **Progress is enrollment-level percent only** — no lesson analytics (known Phase 7/8 limitation).

---

## Phase 9 deliverables checklist

- [x] Postman collection + environment + README  
- [x] Expanded automated API tests  
- [x] Newman executed with evidence  
- [x] Genuine defects fixed (test isolation, Postman auth variables)  
- [x] Frontend build verified  
- [x] Browser smoke on login / dashboard / reports / students  
- [x] This QA report  

## Readiness for final review

**EduAdmin is ready for final review.** Core admin flows, authz, data integrity rules, reports, automated coverage, and a runnable Postman collection are in place against the approved local schema.
