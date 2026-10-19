# Phase 4 — Authentication and Authorization Implementation

## Reused (already present)

- bcrypt password hashing (`authService.login`)
- JWT Bearer tokens with `session_version` revocation on logout
- `authenticate` + `authorize(...roles)` middleware
- All `/api/v1` admin routes behind `authenticate`; `/administrators` behind `authorize('super_admin')`
- Login rate limiting
- Frontend `AuthContext` (restore via `/auth/me`, logout, 401 handler)
- AppShell nav hides Administrators unless `super_admin`

## Completed in Phase 4

| Change | Purpose |
|--------|---------|
| Timing-safe login compare with dummy hash | Avoid user-enumeration timing differences |
| `frontend/src/auth/ProtectedRoutes.jsx` | Modular `RequireAuth` / `GuestOnly` / `RequireRole` |
| Expanded `backend/tests/api.test.js` | Logout invalidation, malformed JWT, `/me`, unauthenticated GETs, inactive admin, no hash leakage |

## Not done / limitations

- No separate frontend unit-test runner (Vitest not installed); route guards verified by code review + API tests
- No student-facing app in this standalone repo (N/A)
- JWT remains in `localStorage` (existing design); HttpOnly cookies not introduced
- Did not reset DB, edit `.env`, or commit to Git

## Test results

```text
npm test
# tests 22
# pass 22
# fail 0
```

Verified: valid admin access, unauthenticated 401s, student 403, role gate on administrators, logout revocation, malformed JWT, inactive admin rejection, no `password_hash` in responses.
