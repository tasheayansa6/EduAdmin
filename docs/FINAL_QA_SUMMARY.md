# EduAdmin — final QA summary

Date of final verification: **2026-10-19** (local development environment).

## Environment

| Component | Status during verification |
| --- | --- |
| MySQL (Docker) | Available |
| API `http://127.0.0.1:4000` | Healthy (`GET /api/v1/health` → `{ ok: true }`) |
| Frontend build (Vite) | Executed |
| Git repository | **Not initialized** in this workspace |

## Automated backend tests

```text
Command: npm test
Result:  57 passed, 0 failed (13 suites)
```

Coverage highlights: auth, authorization, students, courses, enrollments, progress, reports/CSV, validation, dashboard SQL consistency, soft withdraw/unpublish.

## Postman / Newman

```text
Command: npx newman run postman/EduAdmin_API_Testing.postman_collection.json \
  -e postman/EduAdmin_Local.postman_environment.json \
  --env-var adminPassword=<local-seed> --env-var studentPassword=<local-seed>
Result:  32 requests, 46 assertions, 0 failed
```

Passwords were supplied only on the CLI (not stored in the committed environment file).

## Frontend

| Check | Result |
| --- | --- |
| `npm run build` (Vite production) | **Passed** |
| Frontend unit tests | **Not configured** |
| ESLint / TypeScript check | **Not configured** |

## Browser smoke (Phase 9 / retained)

Login, dashboard live totals, reports filters, students table, mobile menu without horizontal overflow — previously verified against the Vite proxy. Not re-screenshot for Phase 10 (no screenshots folder claimed).

## Failed / blocked / not tested

| Item | Classification | Notes |
| --- | --- | --- |
| Lint / typecheck | Not tested | No project scripts |
| Frontend unit tests | Not tested | No harness |
| Forced DB outage / 500 injection | Not tested | Avoided destructive DB stop |
| Git diff review | Blocked | No `.git` directory present |
| Production deploy | Out of scope | Local demo only |

## Bugs addressed in late phases (still resolved)

- Test concurrency race on inactive admin account
- Postman token environment override
- Enrollment progress assertion vs re-enroll preservation

No new critical defects found in the Phase 10 verification pass.

## Conclusion

EduAdmin meets the Phase 1–9 functional scope for local demonstration. Automated API and Newman suites are green; production build succeeds. Remaining gaps are tooling (lint/TS/frontend tests) and Git initialization for submission packaging.
