import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AlertIcon, LeafIcon, PlayIcon } from '../components/icons.jsx';
import { currentEnrollments, useAllCourses, useDocumentTitle, useStudentData } from '../student/StudentData.jsx';
import {
  CardGridSkeleton,
  CourseCover,
  CourseImage,
  Meter,
  StoreOutageNotice,
  StudentData,
  StudentEmpty,
  StudentError,
  enrollmentLink,
  formatPrice,
} from '../student/components.jsx';

function ResumeCard({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  return (
    <article className="overflow-hidden rounded-3xl bg-brand text-white shadow-lift">
      <div className="relative min-h-[16rem] sm:min-h-[18rem]">
        <CourseCover
          category={enrollment.categoryName}
          title={enrollment.courseTitle}
          className="!aspect-auto absolute inset-0 h-full w-full opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand via-brand/70 to-brand/20" />
        <div className="relative flex h-full flex-col justify-end gap-3 p-5 sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wheat">
            Continue learning
            {enrollment.percent != null ? ` · ${percent}% complete` : ''}
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight sm:text-4xl">{enrollment.courseTitle}</h2>
          {enrollment.instructorName ? (
            <p className="text-sm text-white/80">with {enrollment.instructorName}</p>
          ) : enrollment.categoryName ? (
            <p className="text-sm text-white/80">{enrollment.categoryName}</p>
          ) : null}
          <div className="max-w-md [&_[role=progressbar]]:bg-white/20 [&_[role=progressbar]>div]:bg-wheat">
            <Meter value={percent} label="Course progress" />
          </div>
          <Link to={href} className="btn inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-base font-bold text-brand hover:bg-sand sm:w-auto sm:min-w-[18rem]">
            <PlayIcon />
            {percent > 0 ? 'Resume lesson' : 'Start learning'}
          </Link>
        </div>
      </div>
    </article>
  );
}

function CuratedCard({ course }) {
  const to = course.local || !course.slug
    ? `/learn/my-courses/${course.id}`
    : `/learn/courses/${course.slug}`;
  const enrolled = course.enrollment && course.enrollment.status !== 'withdrawn';
  return (
    <article className="flex w-[17.5rem] shrink-0 flex-col overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft sm:w-[19rem]">
      <div className="relative">
        {course.imageUrl ? (
          <CourseImage course={course} className="aspect-[16/10]" />
        ) : (
          <CourseCover category={course.category} title={course.title} className="aspect-[16/10]" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
          {course.category || 'Course'}
        </span>
        {enrolled ? (
          <span className="absolute right-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Enrolled
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-charcoal">
          <Link to={to} className="hover:text-brand">{course.title}</Link>
        </h3>
        {course.instructorName ? (
          <p className="text-xs font-semibold text-charcoal-muted">{course.instructorName}</p>
        ) : null}
        <p className="mt-auto flex items-center justify-between gap-2 pt-2 text-sm">
          <span className={`font-extrabold ${course.isFree ? 'text-brand' : 'text-charcoal'}`}>
            {formatPrice(course.price, course.currency)}
          </span>
          <Link to={to} className="font-bold text-brand hover:underline">
            {enrolled ? 'Open' : 'View'} →
          </Link>
        </p>
      </div>
    </article>
  );
}

function AttentionList({ rows }) {
  if (!rows.length) return null;
  return (
    <section aria-labelledby="attention-title" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 id="attention-title" className="font-display text-xl font-bold text-charcoal">Upcoming focus</h2>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-muted">{rows.length} pending</p>
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
                  {row.percent ?? 0}% complete — resume to keep moving.
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
  const curated = available.length ? available.slice(0, 8) : courses.slice(0, 8);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-hairline bg-gradient-to-br from-brand-soft via-canvas to-white p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Explore</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-charcoal sm:text-5xl">
            Welcome back, {firstName}
          </h1>
          {current.length ? (
            <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
              {active.length} in progress · {data.summary?.completed ?? 0} done
            </span>
          ) : null}
        </div>
        {featured ? (
          <p className="mt-4 inline-flex max-w-2xl items-start gap-2 rounded-2xl bg-white/80 px-3.5 py-2.5 text-sm text-brand shadow-soft [&_svg]:mt-0.5 [&_svg]:h-4 [&_svg]:w-4">
            <LeafIcon />
            <span>
              {remaining != null && remaining > 0
                ? `Weekly goal in sight: you are ${remaining}% away from finishing “${featured.courseTitle}”.`
                : `Pick up “${featured.courseTitle}” and keep learning.`}
            </span>
          </p>
        ) : (
          <p className="mt-3 max-w-xl text-base text-charcoal-muted">
            Find a course below. Enrolling saves it to My learning.
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
          message="Browse curated courses below, or open the full catalog."
          action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
        />
      )}

      {categories.length ? (
        <section aria-labelledby="categories-title" className="space-y-3">
          <h2 id="categories-title" className="font-display text-lg font-bold text-charcoal">Browse by category</h2>
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
          <h2 id="curated-title" className="font-display text-2xl font-bold text-charcoal">Curated for you</h2>
          <p className="mt-1 text-sm text-charcoal-muted">Recommended from the open catalog.</p>
        </div>
        {storeError && courses.length ? <StoreOutageNotice error={storeError} onRetry={reloadStore} /> : null}
        {loading ? (
          <CardGridSkeleton count={3} />
        ) : storeError && !courses.length ? (
          <StudentError title="The course catalog could not be loaded" error={storeError} onRetry={reloadStore} />
        ) : curated.length ? (
          <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-0 sm:px-0">
            {curated.map((course) => (
              <li key={course.key || course.id || course.slug}>
                <CuratedCard course={course} />
              </li>
            ))}
          </ul>
        ) : (
          <StudentEmpty
            title="No published courses yet"
            message="Courses appear here once an administrator publishes them."
          />
        )}
        <div>
          <Link to="/learn/courses" className="btn-quiet px-0">See all courses →</Link>
        </div>
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
