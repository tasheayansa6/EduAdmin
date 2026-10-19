# EduAdmin user guide

For students, administrators, and the super administrator.

## Sign in

1. Open the web app (local default http://localhost:5173).
2. Enter your email and password.
3. Use **Sign in**.

A student lands on **Your learning**. An administrator lands on the admin **Dashboard**. Inactive accounts are rejected. **Log out** ends the session on the server.

## Student registration

1. Open **Create an account** from the sign-in page, or go to `/register`.
2. Enter your name, email, and password, then confirm the password.
3. Submit the form. The account is always created as a student.

There is no phone field. Registration does not enroll anyone. After signing in, the student can enroll in a published course from **Courses**, which stores the enrollment in the database. The student can update their display name from **Profile**. Email and role stay on the account record.

## Student area

- **Home** shows that student's enrollments, completion count, and average progress from stored records.
- **Courses** lists published courses. **Enroll** saves that course to the signed-in student in the database.
- Students cannot open the admin dashboard, reports, or another student's record.

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
