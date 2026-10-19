# Phase 8 — Reports and Analytics

## Completed

### Dashboard (real data)
- `GET /api/v1/dashboard` aggregates live MySQL counts: students, courses (published/draft), non-withdrawn enrollments, average progress.
- Enrollment trend uses `enrolled_at`, last six UTC months, **withdrawn excluded**.
- Attention list uses stored `progress.percent` for active enrollments under 40%.
- Frontend `DashboardPage` renders API data only (no hardcoded totals).

### Reports API
- `GET /api/v1/reports` — admin/super_admin via `authenticate`.
- Query filters: `from`, `to` (UTC, end date inclusive via `< DATE_ADD(to, 1 DAY)`), `courseId`.
- Invalid ranges (`from > to`) → 400.
- `GET /api/v1/reports/export` — CSV of course enrollment rows with the same filters and auth.

### Metrics (definitions)
| Metric | Source | Notes |
|--------|--------|--------|
| Students total / by status | `users` where `role='student'` | Not limited by report dates |
| Courses / published / draft | `courses` | Catalog-wide |
| Enrollments in period | `enrollments` active+completed | Date on `enrolled_at`; withdrawn excluded from total |
| Enrollments by status | Same, includes withdrawn in breakdown | |
| Completion rate | completed / (active+completed) in period | |
| Enrollment trend | Monthly `enrolled_at` | Withdrawn excluded |
| Registration trend | Monthly student `created_at` | |
| Progress summary | `progress` joined to non-withdrawn enrollments | Stored percent only; no lesson-level data |
| Course rows / top / zero-enrollment published | Aggregated LEFT JOIN | Ranked by enrollments DESC |

### Frontend
- `ReportsPage`: summary cards, status split bars, enrollment + registration charts, progress summary, course table, top/low course lists, date+course filters (URL params), CSV export download.
- Loading / empty / error via `DataPanel` and chart empty states.
- `useResource` cancels stale responses when filters change.

### Tests
- Unauthorized reports/export → 401.
- Invalid date range → 400.
- Aggregate shape from DB; empty future range → zeros (no invented progress).
- Course filter narrows rows; CSV content-type and headers.

## Limitations (by design)
- No fabricated growth % or invented historical series beyond months with zero fill for the selected/default window.
- No lesson/module completion analytics (platform stores enrollment-level `progress.percent` only).
- Student PII is not exposed in report tables (course-level aggregates only).
- No PDF export.

## Phase 9 readiness
EduAdmin is ready for Phase 9. Core admin flows (auth, students, courses, enrollments, progress, dashboard, reports) are implemented against the approved schema.
