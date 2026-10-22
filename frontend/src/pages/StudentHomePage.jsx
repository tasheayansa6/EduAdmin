import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AlertIcon, LeafIcon, PlayIcon } from '../components/icons.jsx';
import { currentEnrollments, useAllCourses, useDocumentTitle, useStudentData } from '../student/StudentData.jsx';
import {
  CARD_GRID,
  CardGridSkeleton,
  CatalogCard,
  CourseCover,
  Meter,
  StoreOutageNotice,
  StudentData,
  StudentEmpty,
  StudentError,
  enrollmentLink,
} from '../student/components.jsx';

function ResumeCard({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  return (
    <article className="hub-card">
      <div className="relative aspect-[16/10] overflow-hidden bg-brand sm:aspect-[21/9]">
        <CourseCover category={enrollment.categoryName} title={enrollment.courseTitle} className="!aspect-auto absolute inset-0 h-full w-full opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand via-brand/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 text-white sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-wheat">
            {enrollment.categoryName || 'In progress'}
            {enrollment.percent != null ? ` · ${percent}% complete` : ''}
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{enrollment.courseTitle}</h2>
          {enrollment.instructorName ? (
            <p className="text-sm text-white/80">with {enrollment.instructorName}</p>
          ) : null}
          <div className="max-w-md [&_[role=progressbar]]:bg-white/25 [&_[role=progressbar]>div]:bg-wheat">
            <Meter value={percent} label="Course progress" />
          </div>
          <Link to={href} className="btn-brand inline-flex w-full gap-2 bg-white py-3 text-brand hover:bg-sand sm:w-auto sm:min-w-[16rem]">
            <PlayIcon />
            {percent > 0 ? 'Continue learning' : 'Start learning'}
          </Link>
        </div>
      </div>
    </article>
  );
}

function AttentionList({ rows }) {
  if (!rows.length) return null;
  return (
    <section aria-labelledby="attention-title" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 id="attention-title" className="font-display text-xl font-bold text-charcoal">Keep going</h2>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-muted">{rows.length} course{rows.length === 1 ? '' : 's'}</p>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              to={enrollmentLink(row)}
              className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 transition hover:border-amber-300"
            >
              <span className="mt-0.5 text-amber-700 [&_svg]:h-5 [&_svg]:w-5"><AlertIcon /></span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-charcoal">{row.courseTitle}</span>
                <span className="mt-0.5 block text-sm text-charcoal-muted">
                  {row.percent ?? 0}% complete — resume to keep your progress moving.
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HomeBody({ data }) {
  const { user } = useAuth();
  const firstName = user.name.trim().split(/\s+/)[0];
  const current = currentEnrollments(data);
  const active = current
    .filter((row) => row.status === 'active')
    .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
  const featured = active[0];
  const { courses, loading, storeError, reloadStore } = useAllCourses();
  const available = courses
    .filter((course) => !course.enrollment)
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  const categories = [...courses.reduce((map, course) => map.set(course.category, (map.get(course.category) || 0) + 1), new Map())]
    .filter(([name]) => name)
    .sort((a, b) => a[0].localeCompare(b[0]));
  const attention = active.filter((row) => (row.percent ?? 0) < 40).slice(0, 3);
  const remaining = featured && featured.percent != null
    ? Math.max(0, 100 - featured.percent)
    : null;

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="display-title text-3xl font-bold sm:text-4xl">Welcome back, {firstName}</h1>
          {current.length ? (
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              {active.length} in progress · {data.summary?.completed ?? 0} completed
            </span>
          ) : null}
        </div>
        {featured ? (
          <p className="inline-flex max-w-2xl items-start gap-2 rounded-full bg-brand-soft/80 px-3.5 py-2 text-sm text-brand [&_svg]:mt-0.5 [&_svg]:h-4 [&_svg]:w-4">
            <LeafIcon />
            <span>
              {remaining != null && remaining > 0
                ? `Weekly goal in sight: you are ${remaining}% away from finishing “${featured.courseTitle}”.`
                : `Pick up “${featured.courseTitle}” and keep your streak of learning going.`}
            </span>
          </p>
        ) : (
          <p className="max-w-xl text-base text-charcoal-muted">
            Find a course to start. Enrolling saves it to your learning record.
          </p>
        )}
      </section>

      {featured ? (
        <section aria-labelledby="resume-title">
          <h2 id="resume-title" className="sr-only">Continue learning</h2>
          <ResumeCard enrollment={featured} />
        </section>
      ) : (
        <StudentEmpty
          title="You have not enrolled in a course yet"
          message="Browse the catalog and enroll in a published course to see it here."
          action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
        />
      )}

      {categories.length ? (
        <section aria-labelledby="categories-title" className="space-y-3">
          <h2 id="categories-title" className="sr-only">Browse by category</h2>
          <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <li>
              <Link to="/learn/courses" className="chip-on">All</Link>
            </li>
            {categories.map(([category, count]) => (
              <li key={category}>
                <Link to={`/learn/courses?category=${encodeURIComponent(category)}`} className="chip-off">
                  {category}
                  <span className="text-charcoal-muted">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="curated-title" className="space-y-4">
        <div>
          <h2 id="curated-title" className="font-display text-xl font-bold text-charcoal sm:text-2xl">Curated for you</h2>
          <p className="mt-1 text-sm text-charcoal-muted">Recommended based on what is open in the catalog.</p>
        </div>
        {storeError && courses.length ? <StoreOutageNotice error={storeError} onRetry={reloadStore} /> : null}
        {loading ? (
          <CardGridSkeleton count={3} />
        ) : storeError && !courses.length ? (
          <StudentError title="The course catalog could not be loaded" error={storeError} onRetry={reloadStore} />
        ) : available.length ? (
          <ul className={CARD_GRID}>
            {available.slice(0, 6).map((course) => <li key={course.key}><CatalogCard course={course} /></li>)}
          </ul>
        ) : (
          <StudentEmpty
            title={courses.length ? 'You are enrolled in every published course' : 'No published courses yet'}
            message={courses.length ? 'New courses will appear here when they are published.' : 'Courses appear here once an administrator publishes them.'}
          />
        )}
        {available.length > 6 ? (
          <div className="text-center">
            <Link to="/learn/courses" className="btn-quiet">See all courses</Link>
          </div>
        ) : null}
      </section>

      <AttentionList rows={attention} />
    </div>
  );
}

export function StudentHomePage() {
  useDocumentTitle('Explore');
  const resource = useStudentData();
  return (
    <StudentData resource={resource} label="Loading your learning">
      {(data) => <HomeBody data={data} />}
    </StudentData>
  );
}
