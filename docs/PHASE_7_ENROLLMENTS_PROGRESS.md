# Phase 7 — Enrollment Management and Learning Progress

## 1. Enrollment features implemented

- Paginated table: ID, student, email, course, date, status, progress bar + progress status
- Debounced search (name/email/course), course + status filters
- Create enrollment (active students × published courses only)
- Detail modal via `GET /api/v1/enrollments/:id`
- Status update + soft withdraw (keeps history/progress)
- Loading / empty / error / toast feedback

## 2. Learning progress features

- Dedicated Progress page from `progress` table (percent + status)
- Joined only to non-withdrawn enrollments
- Progress shown on enrollment list/detail when a progress row exists
- Missing percent shown as “No progress data” (not invented)
- **No lessons/modules** in this platform — progress is stored percentages, not lesson-completion math

## 3. Files created or modified

| File | Change |
|------|--------|
| `backend/src/services/enrollmentService.js` | Progress fields; `getEnrollment` |
| `backend/src/routes/index.js` | `GET /enrollments/:id` |
| `frontend/src/pages/EnrollmentsPage.jsx` | Phase 5 UI + debounce + detail |
| `frontend/src/pages/ProgressPage.jsx` | Phase 5 UI + debounce + clarity |
| `frontend/src/hooks/useDebouncedValue.js` | **New** |
| `frontend/src/components/ui.jsx` | Null-safe `ProgressBar` |
| `backend/tests/api.test.js` | Enrollment/progress coverage |

## 4. APIs reused

`GET/POST/PATCH/DELETE /api/v1/enrollments`, `GET /api/v1/progress`, `GET /api/v1/lookups` (all auth-protected).

## 5. Schema changes

None. No new tables.

## 6. Security

Backend `authenticate` on all routes; server validates student/course; duplicate → 409; published-only enroll; soft withdraw.

## 7. Verification

- `npm test` — **29/29 passed**
- `npm run build` (frontend) — passed
- Lint script — not configured

## 8–9. Limitations

- No per-lesson progress (out of data model)
- Progress not admin-editable via dedicated PATCH (status sync via enrollment completed)
- Frontend unit tests for UI states not added (no Vitest)

## 10. Ready for Phase 8?

**Yes** — enrollments and progress are implemented against real APIs and schema.
