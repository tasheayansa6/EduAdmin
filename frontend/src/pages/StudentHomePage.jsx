import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar } from '../components/ui.jsx';
import { ArrowRightIcon } from '../components/icons.jsx';
import { currentEnrollments, useAllCourses, useDocumentTitle, useStudentData } from '../student/StudentData.jsx';
import { CARD_GRID, CardGridSkeleton, CatalogCard, LearningCard, SectionHeading, StoreOutageNotice, StudentData, StudentEmpty, StudentError } from '../student/components.jsx';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function SeeAll({ to, children }) {
  return (
    <Link to={to} className="btn-quiet [&_svg]:h-4 [&_svg]:w-4">
      {children}
      <ArrowRightIcon />
    </Link>
  );
}

function Overview({ data, current }) {
  const items = [
    { label: 'Enrolled', value: current.length },
    { label: 'Completed', value: data.summary.completed },
    { label: 'Average progress', value: data.summary.averageProgress == null ? '—' : `${data.summary.averageProgress}%` },
  ];
  return (
    <dl className="grid grid-cols-3 divide-x divide-hairline rounded-xl border border-hairline bg-white">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3 sm:px-6">
          <dt className="text-xs font-semibold text-charcoal-muted">{item.label}</dt>
          <dd className="mt-0.5 text-xl font-bold tabular-nums text-charcoal sm:text-2xl">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function HomeBody({ data }) {
  const { user } = useAuth();
  const name = user.name;
  const firstName = name.trim().split(/\s+/)[0];
  const current = currentEnrollments(data);
  const active = current
    .filter((row) => row.status === 'active')
    .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
  const { courses, loading, storeError, reloadStore } = useAllCourses();
  const available = courses
    .filter((course) => !course.enrollment)
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  const categories = [...courses.reduce((map, course) => map.set(course.category, (map.get(course.category) || 0) + 1), new Map())]
    .filter(([name]) => name)
    .sort((a, b) => a[0].localeCompare(b[0]));

  const headline = active.length
    ? `You have ${active.length} course${active.length === 1 ? '' : 's'} in progress. Pick up where you left off.`
    : current.length
      ? 'Every course on your account is completed. Find the next one to start.'
      : 'Find a course to start. Enrolling saves it to your learning record.';

  return (
    <div className="space-y-14">
      <section aria-labelledby="welcome-title" className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div className="flex items-start gap-4 sm:items-center sm:gap-5">
          <Avatar name={name} size="xl" tone="brand" />
          <div className="min-w-0">
            <h1 id="welcome-title" className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
              {greeting()}, {firstName}
            </h1>
            <p className="mt-1.5 max-w-xl text-base text-charcoal-muted">{headline}</p>
            <Link to="/learn/courses" className="btn-brand mt-4">Explore courses</Link>
          </div>
        </div>
        <Overview data={data} current={current} />
      </section>

      <section aria-labelledby="continue-title">
        <SectionHeading
          id="continue-title"
          title="Continue learning"
          description="Your active enrollments, newest first. Progress updates as you tick off lessons."
          action={current.length ? <SeeAll to="/learn/my-learning">My learning</SeeAll> : null}
        />
        {active.length ? (
          <ul className={CARD_GRID}>
            {active.slice(0, 4).map((row) => <li key={row.id}><LearningCard enrollment={row} /></li>)}
          </ul>
        ) : (
          <StudentEmpty
            title={current.length ? 'No active courses' : 'You have not enrolled in a course yet'}
            message={current.length ? 'Your completed courses are listed in My learning.' : 'Browse the catalog and enroll in a published course to see it here.'}
            action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
          />
        )}
      </section>

      {categories.length ? (
        <section aria-labelledby="categories-title">
          <SectionHeading id="categories-title" title="Browse by category" description="Categories of the published courses in the catalog." />
          <ul className="flex flex-wrap gap-2.5">
            {categories.map(([category, count]) => (
              <li key={category}>
                <Link to={`/learn/courses?category=${encodeURIComponent(category)}`} className="chip-off px-4 py-2">
                  {category}
                  <span className="text-charcoal-muted">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="available-title">
        <SectionHeading
          id="available-title"
          title="Available to enroll"
          description="Newest courses you have not joined yet."
          action={<SeeAll to="/learn/courses">All courses</SeeAll>}
        />
        {storeError && courses.length ? <StoreOutageNotice error={storeError} onRetry={reloadStore} /> : null}
        {loading ? (
          <CardGridSkeleton count={4} />
        ) : storeError && !courses.length ? (
          <StudentError title="The course catalog could not be loaded" error={storeError} onRetry={reloadStore} />
        ) : available.length ? (
          <ul className={CARD_GRID}>
            {available.slice(0, 8).map((course) => <li key={course.key}><CatalogCard course={course} /></li>)}
          </ul>
        ) : (
          <StudentEmpty
            title={courses.length ? 'You are enrolled in every published course' : 'No published courses yet'}
            message={courses.length ? 'New courses will appear here when they are published.' : 'Courses appear here once an administrator publishes them.'}
          />
        )}
      </section>
    </div>
  );
}

export function StudentHomePage() {
  useDocumentTitle('Home');
  const resource = useStudentData();
  return (
    <StudentData resource={resource} label="Loading your learning">
      {(data) => <HomeBody data={data} />}
    </StudentData>
  );
}
