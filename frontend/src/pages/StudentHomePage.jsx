import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AlertIcon, ArrowRightIcon, CheckIcon, ClockIcon, LeafIcon, PlayIcon, UserIcon } from '../components/icons.jsx';
import { currentEnrollments, useAllCourses, useDocumentTitle, useStudentData } from '../student/StudentData.jsx';
import {
  CardGridSkeleton,
  CourseCover,
  CourseImage,
  StudentData,
  StudentEmpty,
  enrollmentLink,
} from '../student/components.jsx';

function lessonsLeft(percent) {
  if (percent == null) return null;
  return Math.max(1, Math.ceil((100 - percent) / 12));
}

function moduleLabel(percent) {
  const module = Math.max(1, Math.min(8, Math.ceil((percent || 10) / 15)));
  return `Module ${module}`;
}

function lessonLabel(percent) {
  const lesson = Math.max(1, Math.min(24, Math.ceil((percent || 8) / 5)));
  if (percent <= 0) return 'Start learning';
  return `Resume Lesson ${lesson}`;
}

function ResumeCard({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  const mins = enrollment.totalMinutes
    ? Math.max(15, Math.round((Number(enrollment.totalMinutes) || 60) * (1 - percent / 100) / 4))
    : 35;
  const resume = lessonLabel(percent);

  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-soft md:shadow-md">
      <div className="relative h-44 bg-sand md:h-56 lg:h-64">
        <CourseCover
          category={enrollment.categoryName}
          title={enrollment.courseTitle}
          className="!aspect-auto absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-charcoal backdrop-blur-md [&_svg]:h-3.5 [&_svg]:w-3.5">
          <ClockIcon />
          {mins} mins left
        </span>
        <div className="absolute inset-x-3 bottom-3 text-white md:inset-x-5 md:bottom-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">
            {moduleLabel(percent)} · {(enrollment.categoryName || 'Optimization').toUpperCase()}
          </p>
          <p className="mt-0.5 truncate text-base font-semibold md:text-lg">{resume}</p>
        </div>
      </div>

      <div className="h-1.5 w-full bg-brand-soft">
        <div className="h-full bg-brand transition-all" style={{ width: `${percent}%` }} />
      </div>

      <div className="flex flex-col gap-3 p-4 md:gap-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl font-semibold tracking-tight text-charcoal md:text-2xl">
              {enrollment.courseTitle}
            </h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-brand">
              <UserIcon />
              <span className="truncate">{enrollment.instructorName || 'Instructor TBA'}</span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand">{percent}%</p>
            <p className="text-sm text-charcoal-muted">Completed</p>
          </div>
        </div>

        <Link
          to={href}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white shadow-soft hover:bg-brand-hover md:max-w-md"
        >
          <PlayIcon />
          <span className="truncate">{resume}</span>
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
  const modules = course.lessonCount
    || (course.sections || []).reduce((sum, section) => sum + (section.lessons?.length || 0), 0)
    || null;
  const track = course.category || 'Course';
  const rating = course.ratingAvg != null ? Number(course.ratingAvg).toFixed(1) : null;
  const students = course.ratingCount != null ? Number(course.ratingCount).toLocaleString() : null;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-soft">
      <div className="relative h-36 shrink-0 bg-sand md:h-40">
        {course.imageUrl ? (
          <CourseImage course={course} className="!aspect-auto h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <CourseCover category={course.category} title={course.title} className="!aspect-auto h-full w-full" />
        )}
        {enrolled ? (
          <span className="absolute right-2.5 top-2.5 inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand">
            Enrolled
          </span>
        ) : modules ? (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-charcoal backdrop-blur-md">
            {modules} modules
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-brand">{track}</span>
          {enrolled && modules ? (
            <>
              <span className="text-[10px] text-charcoal-muted">•</span>
              <span className="text-sm text-charcoal-muted">{modules} modules</span>
            </>
          ) : !enrolled ? (
            <>
              <span className="text-[10px] text-charcoal-muted">•</span>
              <span className="text-sm text-charcoal-muted">Prerequisite Met</span>
            </>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-charcoal">
          <Link to={to} className="hover:text-brand">{course.title}</Link>
        </h3>
        <p className="text-sm text-charcoal-muted">{course.instructorName || 'Instructor TBA'}</p>

        <div className="mt-1.5 flex items-center justify-between gap-2 pt-1.5">
          {rating ? (
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-charcoal">{rating}</span>
              <span className="text-wheat" aria-hidden="true">★</span>
              {students ? <span className="text-sm text-charcoal-muted">({students})</span> : null}
            </div>
          ) : (
            <span className="text-sm text-charcoal-muted">{course.isFree ? 'Free' : 'Open'}</span>
          )}

          {enrolled ? (
            <Link to={to} className="inline-flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wide text-brand hover:underline [&_svg]:h-3.5 [&_svg]:w-3.5">
              View Syllabus
              <ArrowRightIcon />
            </Link>
          ) : (
            <Link
              to={to}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-brand-soft px-3 text-xs font-semibold text-brand hover:bg-brand hover:text-white"
            >
              + Enroll Now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function DeadlineRow({ enrollment, urgent, dayLabel, timeLabel }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-soft">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${urgent ? 'bg-wheat/25 text-wheat-ink' : 'bg-sand text-charcoal-muted'}`}>
          {urgent ? <AlertIcon /> : <CheckIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-charcoal">{enrollment.courseTitle}</h4>
          <p className="text-sm text-charcoal-muted">
            {enrollment.categoryName || 'Course work'}
          </p>
        </div>
      </div>
      <div className="ml-2 flex shrink-0 flex-col items-end">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${urgent ? 'bg-wheat/25 text-wheat-ink' : 'bg-sand text-charcoal-muted'}`}>
          {dayLabel}
        </span>
        <span className="mt-0.5 text-sm text-charcoal-muted">{timeLabel}</span>
      </div>
    </div>
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
  const deadlines = active.filter((row) => (row.percent ?? 0) < 80).slice(0, 2);
  const left = featured ? lessonsLeft(featured.percent) : null;

  return (
    <div className="flex w-full flex-col md:gap-1">
      <section className="space-y-2 pb-2 pt-1 md:pb-3 md:pt-2">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2 md:mb-2">
          <h1 className="font-display text-[1.625rem] font-bold leading-[1.3] tracking-tight text-charcoal md:text-4xl md:tracking-tight">
            Welcome back, {firstName}!
          </h1>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-brand">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" aria-hidden="true" />
            Undergraduate · Year 3
          </span>
        </div>

        {featured ? (
          <div className="flex items-start gap-2 rounded-xl bg-mint-soft p-4 shadow-soft md:max-w-3xl">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand [&_svg]:h-5 [&_svg]:w-5">
              <LeafIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-charcoal">Weekly Goal in Sight</p>
              <p className="text-xs leading-relaxed text-charcoal-muted md:text-sm">
                {left ? (
                  <>
                    You're <span className="font-bold text-brand">{left} lesson{left === 1 ? '' : 's'} away</span>
                    {' '}from completing &lsquo;{featured.courseTitle}&rsquo; this week.
                  </>
                ) : (
                  <>Keep going in &lsquo;{featured.courseTitle}&rsquo;.</>
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-charcoal-muted">Browse curated courses and enroll to start learning.</p>
        )}
      </section>

      {featured ? (
        <section className="space-y-2 py-2" aria-labelledby="in-progress-heading">
          <div className="flex items-center justify-between gap-2">
            <p id="in-progress-heading" className="text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal-muted">
              In Progress
            </p>
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand">
              {active.length} active course{active.length === 1 ? '' : 's'}
            </p>
          </div>
          <ResumeCard enrollment={featured} />
        </section>
      ) : (
        <div className="py-2">
          <StudentEmpty
            title="You have not enrolled in a course yet"
            message="Browse curated courses below, or open all courses."
            action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
          />
        </div>
      )}

      <section className="space-y-2 py-2" aria-labelledby="categories-heading">
        <div className="flex items-center justify-between gap-2">
          <h2 id="categories-heading" className="text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal-muted">
            Categories
          </h2>
          <Link to="/learn/courses" className="text-[11px] font-bold uppercase tracking-wide text-brand hover:underline">
            View hierarchy
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(categories.length > 1 ? categories : ['All']).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-xs font-semibold shadow-soft transition ${
                category === item
                  ? 'bg-brand text-white'
                  : 'bg-white text-charcoal hover:bg-mint-soft'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 py-2" aria-labelledby="curated-heading">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 id="curated-heading" className="font-display text-xl font-semibold tracking-tight text-charcoal">
              Curated For Your Degree
            </h2>
            <p className="text-sm text-charcoal-muted">Recommended based on completed prerequisites</p>
          </div>
          <Link
            to="/learn/courses"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand text-charcoal-muted hover:bg-brand-soft hover:text-brand"
            aria-label="Filter courses"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <CardGridSkeleton count={6} />
        ) : curated.length ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
            {curated.map((course) => (
              <li key={course.key || course.id || course.slug} className="group min-w-0">
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
        <section className="space-y-3 pb-2 pt-2 md:pt-4" aria-labelledby="deadlines-heading">
          <div className="flex items-center justify-between gap-2">
            <h2 id="deadlines-heading" className="font-display text-xl font-semibold tracking-tight text-charcoal md:text-2xl">
              Upcoming Deadlines
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">
              {deadlines.length} pending
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
            {deadlines.map((row, index) => (
              <li key={row.id}>
                <Link to={enrollmentLink(row)} className="block">
                  <DeadlineRow
                    enrollment={row}
                    urgent={index === 0}
                    dayLabel={index === 0 ? 'Due Tomorrow' : 'Friday'}
                    timeLabel={index === 0 ? '11:59 PM' : '5:00 PM'}
                  />
                </Link>
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
