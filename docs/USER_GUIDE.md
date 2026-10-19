# EduAdmin user guide

For authorized **administrators** and **super administrators** using the web dashboard.

## Sign in

1. Open the web app (local default http://localhost:5173).
2. Enter your administrator email and password.
3. Use **Sign in**. Students and inactive accounts are rejected.

On success you land on the **Dashboard**. Your session uses a secure token stored in the browser; **Sign out** from the profile menu ends the session on the server as well.

## Dashboard

The overview shows live counts (students, courses, enrollments, average progress), an enrollment trend chart, catalog published/draft split, items needing attention (active enrollments under 40% progress), and recent activity. Quick links open Students, Courses, Enrollments, and Reports.

## Students

- Search by name or email; filter by status (active, inactive, suspended).
- Open a student to view enrollments and progress percentages.
- Edit name, email, or status. Status changes affect whether the student can be newly enrolled (only **active** students can be enrolled).

There is no “add student” action in this admin app; student accounts come from the platform / seed data.

## Courses

- Search and filter by status (draft / published) or category.
- Create a course with title, description, category, and status.
- Publish or unpublish via edit, or use **Unpublish** (soft delete) to set a course back to draft while keeping history.
- Only **published** courses accept new enrollments.

## Enrollments

- Search and filter by status or course.
- Create an enrollment by choosing an active student and a published course.
- Mark enrollments **active**, **completed**, or **withdrawn**. Completing sets progress to 100%.
- **Withdraw** soft-cancels the enrollment; the row remains for history. Re-enrolling the same student in the same course after withdraw may restore the prior progress record.

## Progress

Read-only list of enrollment-level progress (`percent` and status such as not started / in progress / completed). Filter by search, progress status, and course. Lesson-level tracking is not available.

## Reports & analytics

- Summary cards, status breakdowns, enrollment and registration trends, course enrollment table, top courses, and published courses with zero enrollments in the period.
- Filter by **From** / **To** (UTC, end date inclusive) and optional **Course**.
- **Export course CSV** downloads the filtered course enrollment table.
- Student status totals are current account states (not limited by the enrollment date filter); enrollment metrics follow the selected period.

## Profile

Update your display name from **Profile** in the user menu. Role cannot be changed from the profile form.

## Administrators (super admin only)

Super administrators can list administrators, add a new admin account, and activate or deactivate other admins (not themselves, and not other super admins). Regular administrators do not see this section.

## Tips

- Tables use server-side pagination; keep filters when moving pages.
- Error banners and toasts explain validation and permission failures.
- On small screens, open the **Menu** control to reach navigation links.
