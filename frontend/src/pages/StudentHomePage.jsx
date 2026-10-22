import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AlertIcon, CheckIcon, LeafIcon, PlayIcon } from '../components/icons.jsx';
import { currentEnrollments, useAllCourses, useDocumentTitle, useStudentData } from '../student/StudentData.jsx';
import {
  CardGridSkeleton,
  CourseCover,
  CourseImage,
  Meter,
  StudentData,
  StudentEmpty,
  enrollmentLink,
  formatPrice,
} from '../student/components.jsx';

function ResumeCard({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  const action = percent > 0 ? 'Resume lesson' : 'Start learning';
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-hairline bg-white shadow-soft">
      <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[2.15/1]">
        <CourseCover
          category={enrollment.categoryName}
          title={enrollment.courseTitle}
          className="!aspect-auto absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-transparent" />
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-charcoal shadow-soft">
          Continue
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
            {enrollment.categoryName || 'Module'}
            {enrollment.percent != null ? ` · ${percent}%` : ''}
          </p>
          <p className="mt-1 font-display text-lg font-bold leading-snug sm:text-xl">
            {action}: {enrollment.courseTitle}
          </p>
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <h3 className="font-display text-lg font-bold text-charcoal">{enrollment.courseTitle}</h3>
          <p className="mt-1 text-sm text-charcoal-muted">
            {[enrollment.instructorName, enrollment.percent != null ? `${percent}% Completed` : null]
              .filter(Boolean)
              .join(' · ') || 'Continue learning'}
          </p>
        </div>
        <Meter value={percent} label="Course progress" />
        <Link
          to={href}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3.5 text-sm font-bold text-white shadow-soft hover:bg-brand-hover"
        >
          <PlayIcon />
          {action}
        </Link>
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
    <article className="overflow-hidden rounded-[1.5rem] border border-hairline bg-white shadow-soft">
      <div className="relative aspect-[16/9] bg-sand">
        {course.imageUrl ? (
          <CourseImage course={course} className="h-full w-full object-cover" />
        ) : (
          <CourseCover category={course.category} title={course.title} className="!aspect-auto h-full w-full" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand shadow-soft">
          {course.category || 'Course'}
        </span>
        {enrolled ? (
          <span className="absolute right-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Enrolled
          </span>
        ) : course.lessonCount ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-charcoal shadow-soft">
            {course.lessonCount} lessons
          </span>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-display text-lg font-bold leading-snug text-charcoal">
            <Link to={to} className="hover:text-brand">{course.title}</Link>
          </h3>
          {course.instructorName ? (
            <p className="mt-1 text-sm text-charcoal-muted">{course.instructorName}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`text-base font-extrabold ${course.isFree ? 'text-brand' : 'text-charcoal'}`}>
            {formatPrice(course.price, course.currency)}
          </span>
          {enrolled ? (
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand">Enrolled</span>
          ) : (
            <span className="rounded-full bg-mint px-2.5 py-1 text-[11px] font-bold text-brand">Open</span>
          )}
        </div>
        <Link
          to={to}
          className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold ${
            enrolled
              ? 'border border-brand/20 bg-brand-soft text-brand hover:bg-brand hover:text-white'
              : 'bg-brand text-white hover:bg-brand-hover'
          }`}
        >
          {enrolled ? 'View syllabus' : '+ Enroll now'}
        </Link>
      </div>
    </article>
  );
}

function DeadlineRow({ enrollment, urgent }) {
  return (
    <Link
      to={enrollmentLink(enrollment)}
      className="flex items-start gap-3 rounded-2xl border border-hairline bg-white p-3.5 shadow-soft transition hover:border-brand/30"
    >
      <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${urgent ? 'bg-wheat/20 text-wheat' : 'bg-brand-soft text-brand'}`}>
        {urgent ? <AlertIcon /> : <CheckIcon />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-charcoal">{enrollment.courseTitle}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${urgent ? 'bg-wheat/20 text-wheat-ink' : 'bg-brand-soft text-brand'}`}>
            {urgent ? 'Due Tomorrow' : 'This week'}
          </span>
        </span>
        <span className="mt-0.5 block text-sm text-charcoal-muted">
          {urgent ? '11:59 PM' : '5:00 PM'} · {enrollment.percent ?? 0}% complete
        </span>
      </span>
    </Link>
  );
}

function HomeBody({ data }) {
  const { user } = useAuth();
  const firstName = user.name.trim().split(/\s+/)[0];
  const [category, setCategory] = useState('All');
  const current = currentEnrollments(data);
  const active = current
    .filter((row) => row.status === 'active')
    .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
  const featured = active[0];
  const { courses, loading } = useAllCourses();
  const available = courses.filter((course) => !course.enrollment);
  const categories = ['All', ...[...new Set(courses.map((course) => course.category).filter(Boolean))].sort()];
  const curatedBase = available.length ? available : courses;
  const curated = (category === 'All'
    ? curatedBase
    : curatedBase.filter((course) => course.category === category)
  ).slice(0, 6);
  const deadlines = active.filter((row) => (row.percent ?? 0) < 70).slice(0, 2);
  const remaining = featured && featured.percent != null
    ? Math.max(0, 100 - featured.percent)
    : null;

  return (
    <div className="space-y-7">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-3xl font-bold tracking-tight text-charcoal sm:text-[2.15rem]">
            Welcome back, {firstName}!
          </h1>
          <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            Student
          </span>
        </div>
        {featured ? (
          <div className="flex items-start gap-2 rounded-2xl border border-brand/15 bg-brand-soft/90 px-4 py-3 text-sm text-brand [&_svg]:mt-0.5 [&_svg]:h-4 [&_svg]:w-4">
            <LeafIcon />
            <div>
              <p className="font-bold">Weekly Goal in Sight</p>
              <p className="mt-0.5 text-brand/85">
                {remaining != null && remaining > 0
                  ? `You're ${remaining}% away from completing “${featured.courseTitle}”.`
                  : `Keep going in “${featured.courseTitle}”.`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-charcoal-muted">Browse courses and enroll to start learning.</p>
        )}
      </header>

      {featured ? (
        <section aria-labelledby="in-progress-heading" className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">In progress</p>
              <h2 id="in-progress-heading" className="font-display text-xl font-bold text-charcoal">
                {active.length} active course{active.length === 1 ? '' : 's'}
              </h2>
            </div>
            <Link to="/learn/my-learning" className="text-sm font-bold text-brand hover:underline">
              View all
            </Link>
          </div>
          <ResumeCard enrollment={featured} />
        </section>
      ) : (
        <StudentEmpty
          title="You have not enrolled in a course yet"
          message="Browse curated courses below, or open all courses."
          action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
        />
      )}

      <section aria-labelledby="curated-heading" className="space-y-4">
        {categories.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                  category === item
                    ? 'bg-brand text-white shadow-soft'
                    : 'bg-white text-charcoal ring-1 ring-hairline hover:bg-mint-soft'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="curated-heading" className="font-display text-xl font-bold text-charcoal sm:text-2xl">
              Curated For Your Degree
            </h2>
            <p className="mt-1 text-sm text-charcoal-muted">Recommended based on your enrolled courses</p>
          </div>
          <Link to="/learn/courses" className="text-sm font-bold text-brand hover:underline">
            See all
          </Link>
        </div>
        {loading ? (
          <CardGridSkeleton count={3} />
        ) : curated.length ? (
          <ul className="space-y-4">
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
      </section>

      {deadlines.length ? (
        <section aria-labelledby="deadlines-heading" className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 id="deadlines-heading" className="font-display text-xl font-bold text-charcoal">
              Upcoming Deadlines
            </h2>
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-muted">
              {deadlines.length} pending
            </p>
          </div>
          <ul className="space-y-3">
            {deadlines.map((row, index) => (
              <li key={row.id}>
                <DeadlineRow enrollment={row} urgent={index === 0} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
