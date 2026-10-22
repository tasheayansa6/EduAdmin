# EduAdmin user guide

For students, administrators, and the super administrator.

## Sign in

1. Open the web app (local default http://localhost:5173).
2. Enter your email and password.
3. Use **Sign in**.

A student lands on the learning **Home** page. An administrator lands on the admin **Dashboard**. Inactive accounts are rejected. **Log out** ends the session on the server.

## Student registration

1. Open **Create an account** from the sign-in page, or go to `/register`.
2. Enter your name, email, and password, then confirm the password.
3. Submit the form. The account is always created as a student.

There is no phone field. Registration does not enroll anyone. After signing in, the student can enroll in a published course from its course page, which stores the enrollment in the database. The student can update their display name from **Profile**. Email and role stay on the account record.

## Student area

The header search looks through published course titles, categories, and descriptions. The account menu (avatar) opens My learning, Favorites, Cart, Notifications, Edit profile, Account security, and Log out. The old Progress page now redirects to My learning. On small screens the menu button opens the same links.

- **Home** greets the student, summarizes enrolled and completed courses with average progress, lists active enrollments under **Continue learning**, and shows categories and published courses not yet joined.
- **Explore courses** lists every published course. Filter by category or by enrolled / not enrolled, and sort by title. **View course** opens the course page.
- **Course page** shows the title, description, category, and the student's enrollment. **Enroll in this course** (or **Enroll again** after a withdrawal) saves the enrollment in the database and starts progress at 0%. After enrolling, **Start learning** / **Continue learning** opens the lesson player (video, PDF, or reading).
- **My learning** lists the student's enrollments by status (all, active, completed, withdrawn) with stored progress, and can be searched.
- **Profile** has a **Public profile** form (first and last name, a 60-character headline, biography without links, language, website and social usernames), **Account security** (change password; this signs the student out everywhere else), and **View public profile**, a preview only the student can see. Email is read-only.
- **Explore courses** and **Home** list both the courses administrators publish in EduAdmin and the AILG Academy store. EduAdmin courses have a price set by the administrator: free courses enroll from the course page; paid courses use **Add to cart**, **Favorites**, and Chapa checkout — the same cart students already use for AILG courses. If the AILG Academy API is offline, a notice says so and the EduAdmin courses stay listed.
- **Notifications** (the bell in the header) also announce every course an administrator publishes, linking to it.
- **Notifications** lists real events: welcome on sign-up, enrollments made by the student or an administrator, status changes by an administrator, Chapa payments received or not completed, finishing every lesson in a course, and password changes. The badge shows the unread count, refreshed every minute and when the tab regains focus.
- Students cannot open the admin dashboard, reports, or another student's record.

Administrators can set price, instructor, cover image, and an outline of lessons with optional video or PDF URLs. Students watch or open those materials in the course player after enrolling. Course covers without an image use a neutral design tinted by category.

## Dashboard

The overview shows live counts (students, courses, enrollments, average progress), an enrollment trend chart, catalog published/draft split, items needing attention (active enrollments under 40% progress), and recent activity. Quick links open Students, Courses, Enrollments, and Reports.

## Students

- **Add student** creates an account with a temporary password the learner can use to sign in.
- Search by name or email; filter by status (active, inactive, suspended).
- Open a student to view enrollments and progress percentages.
- Edit name, email, or status. Status changes affect whether the student can be newly enrolled (only **active** students can be enrolled).

Students can also register themselves through the student portal.

## Courses

- Search and filter by status (draft / published) or category.
- Create a course with title, description, category, price, and status.
- Add sections and lessons under **Lessons (video / PDF / reading)**. Paste YouTube, Vimeo, direct video, or PDF links so enrolled students can open them in the player.
- Publish or unpublish via edit, or use **Unpublish** (soft delete) to set a course back to draft while keeping history.
- Only **published** courses accept new enrollments.

## Enrollments

- Search and filter by status or course.
- Create an enrollment by choosing an active student and a published course.
- Mark enrollments **active**, **completed**, or **withdrawn**. Completing sets progress to 100%.
- **Withdraw** soft-cancels the enrollment; the row remains for history. Re-enrolling the same student in the same course after withdraw may restore the prior progress record.

## Progress

Read-only list of enrollment-level progress (`percent` and status such as not started / in progress / completed). Filter by search, progress status, and course. Students mark lessons done in the player; that updates the same progress percent.

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
