# EduAdmin API overview

Base URL (local): `http://127.0.0.1:4000`

Versioned prefix: `/api/v1`

Authentication: `Authorization: Bearer <jwt>` on protected routes. Login returns `{ token, user }`. There is **no Swagger UI**; use this document and the Postman collection.

## Public

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | `{ ok: true }` |
| GET | `/api/v1/health` | Same |
| POST | `/api/v1/auth/login` | Body: `{ email, password }`. Same error for an unknown email and a wrong password. |
| POST | `/api/v1/auth/register` | Student registration. Body: `{ name, email, password, confirmPassword }`. Role is always `student`. |

## Signed-in account (student or administrator)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/auth/me` | Current user. No password hash. |
| PATCH | `/api/v1/auth/me` | Body: `{ name }` only. Role cannot be changed. |
| POST | `/api/v1/auth/logout` | Increments session version and invalidates the token (`204`) |

## Student

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/student/home` | Signed-in student's profile, enrollments, progress, and published catalog. |
| POST | `/api/v1/student/enrollments` | Body: `{ courseId }`. Enrolls the signed-in student in a published course and stores the row in `enrollments`. |

## Protected (admin / super_admin)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/dashboard` | Aggregate overview |
| GET | `/api/v1/students` | Query: `q`, `page`, `limit`, `status` |
| GET | `/api/v1/students/:id` | Detail + enrollments |
| PATCH | `/api/v1/students/:id` | `{ name, email, status }` |
| GET | `/api/v1/courses` | Query: `q`, `page`, `limit`, `status`, `categoryId` |
| POST | `/api/v1/courses` | Create |
| PATCH | `/api/v1/courses/:id` | Partial update |
| DELETE | `/api/v1/courses/:id` | Soft unpublish → `draft` |
| GET | `/api/v1/enrollments` | Query filters + pagination |
| GET | `/api/v1/enrollments/:id` | Detail |
| POST | `/api/v1/enrollments` | `{ userId, courseId }` |
| PATCH | `/api/v1/enrollments/:id` | `{ status }` |
| DELETE | `/api/v1/enrollments/:id` | Soft withdraw |
| GET | `/api/v1/progress` | Progress rows |
| GET | `/api/v1/reports` | Query: `from`, `to`, `courseId` |
| GET | `/api/v1/reports/export` | CSV (`text/csv`) |
| GET | `/api/v1/lookups` | Form select data |

## Super admin only

| Method | Path |
| --- | --- |
| GET/POST | `/api/v1/administrators` |
| PATCH | `/api/v1/administrators/:id` |

## Errors

JSON shape: `{ message, errors?: [{ field, message }] }`. Typical statuses: `400`, `401`, `403`, `404`, `409`, `500` (generic message, no stack).

## Postman

See [`../postman/README.md`](../postman/README.md).
