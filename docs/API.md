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
| GET | `/api/v1/student/home` | Signed-in student's profile, summary, enrollments (each with `courseId`, status, `percent`, `progressStatus`), and the published catalog with that student's `enrollmentStatus`, `percent`, and `progressStatus` per course. |
| POST | `/api/v1/student/enrollments` | Body: `{ courseId }`. Enrolls the signed-in student in a published course and stores the row in `enrollments`. |
| GET | `/api/v1/student/profile` | Public profile: `firstName`, `lastName`, `headline`, `biography`, `language`, `website`, `facebook`, `instagram`, `linkedin`, `tiktok`, `x`, `youtube`, plus `name`, `email`, `memberSince`. Falls back to the account name when nothing is saved. |
| PUT | `/api/v1/student/profile` | Same fields. Headline max 60; links are rejected in the biography; `website` must be http(s); social fields are usernames only; `linkedin` is `in/…`, `company/…` or `school/…`. Also sets the account name to "first last". |
| POST | `/api/v1/student/password` | Body: `{ currentPassword, newPassword }`. Wrong current password returns `400`. Bumps the session version (other sessions get `401`) and returns a new `{ token }`. |
| GET | `/api/v1/student/notifications?limit=20` | `{ items: [{ id, type, title, body, link, read, createdAt }], unread }`, newest first. Types: `welcome`, `enrollment`, `payment`, `completion`, `security`. |
| POST | `/api/v1/student/notifications/read` | Body: `{ ids?: number[] }`. Marks those (or all) of the caller's notifications read. |
| GET | `/api/v1/student/learn/local/:courseId` | Enrolled student's lesson list for a local EduAdmin course (sections with `videoUrl` / `pdfUrl` / `content`, progress). `403` if not enrolled. |
| PUT | `/api/v1/student/learn/local/:courseId/lessons/:lessonId` | Body: `{ completed: boolean }`. Updates lesson progress and enrollment-level percent. |
| GET | `/api/v1/student/learn/:slug` | Same for an AILG store course (by slug). |
| PUT | `/api/v1/student/learn/:slug/lessons/:lessonId` | Mark an AILG lesson complete / incomplete. |

Course create/update `outline` lessons may include `type` (`video` \| `pdf` \| `article`), `videoUrl`, `pdfUrl`, `content`, `durationMinutes`, and `isPreview`.

## Protected (admin / super_admin)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/dashboard` | Aggregate overview |
| GET | `/api/v1/students` | Query: `q`, `page`, `limit`, `status` |
| POST | `/api/v1/students` | `{ name, email, password }` — admin creates a student |
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
