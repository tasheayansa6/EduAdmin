import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AlertIcon, ArrowRightIcon, CheckIcon, ClockIcon, LeafIcon, PlayIcon } from '../components/icons.jsx';
import { currentEnrollments, useAllCourses, useDocumentTitle, useStudentData } from '../student/StudentData.jsx';
import {
  CardGridSkeleton,
  CourseCover,
  CourseImage,
  StudentData,
  StudentEmpty,
  enrollmentLink,
  formatPrice,
} from '../student/components.jsx';

function lessonsLeft(percent) {
  if (percent == null) return null;
  return Math.max(1, Math.ceil((100 - percent) / 12));
}

function moduleLabel(percent) {
  const module = Math.max(1, Math.min(8, Math.ceil((percent || 10) / 15)));
  return `Module ${module}`;
}

function ResumeCard({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  const mins = enrollment.totalMinutes
    ? Math.max(15, Math.round((Number(enrollment.totalMinutes) || 60) * (1 - percent / 100) / 4))
    : 35;
  const action = percent > 0
    ? `Resume ${enrollment.courseTitle}`
    : `Start ${enrollment.courseTitle}`;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="relative aspect-[5/4] overflow-hidden sm:aspect-[2.05/1]">
        <CourseCover
          category={enrollment.categoryName}
          title={enrollment.courseTitle}
          className="!aspect-auto absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/35 to-transparent" />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-charcoal shadow-soft [&_svg]:h-3.5 [&_svg]:w-3.5">
          <ClockIcon />
          {mins} mins left
        </span>
        <div className="absolute inset-x-0 bottom-0 space-y-0.5 p-3 text-white sm:p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-wheat">
            {moduleLabel(percent)} · {(enrollment.categoryName || 'Optimization').toUpperCase()}
          </p>
          <p className="font-display text-lg font-bold leading-snug sm:text-xl">
            {percent > 0 ? 'Resume lesson' : 'Start learning'}
          </p>
          <p className="line-clamp-1 text-sm text-white/85">{enrollment.courseTitle}</p>
        </div>
      </div>
      <div className="space-y-3 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold leading-snug text-charcoal sm:text-lg">
              {enrollment.courseTitle}
            </h3>
            <p className="mt-0.5 text-sm text-charcoal-muted">
              {enrollment.instructorName || 'Instructor TBA'}
            </p>
          </div>
          <p className="shrink-0 text-sm font-bold text-brand">{percent}% Completed</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-brand-soft">
          <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
        </div>
        <Link
          to={href}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-soft hover:bg-brand-hover"
        >
          <PlayIcon />
          <span className="truncate">{action}</span>
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

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="relative aspect-[16/10] bg-sand">
        {course.imageUrl ? (
          <CourseImage course={course} className="!aspect-auto h-full w-full" />
        ) : (
          <CourseCover category={course.category} title={course.title} className="!aspect-auto h-full w-full" />
        )}
        {enrolled ? (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-soft">
            Enrolled
          </span>
        ) : (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-brand shadow-soft">
            Prerequisite met
          </span>
        )}
      </div>
      <div className="space-y-2.5 p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
            {track}
          </span>
          {modules ? (
            <span className="text-[11px] font-semibold text-charcoal-muted">{modules} modules</span>
          ) : null}
        </div>
        <div>
          <h3 className="font-display text-base font-bold leading-snug text-charcoal">
            <Link to={to} className="hover:text-brand">{course.title}</Link>
          </h3>
          <p className="mt-0.5 text-sm text-charcoal-muted">
            {course.instructorName || 'Instructor TBA'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`text-base font-extrabold ${course.isFree ? 'text-brand' : 'text-charcoal'}`}>
            {formatPrice(course.price, course.currency)}
          </span>
          {course.ratingAvg != null ? (
            <span className="text-sm font-semibold text-charcoal-muted">
              ★ {Number(course.ratingAvg).toFixed(1)}
              {course.ratingCount ? (
                <span className="font-normal"> ({Number(course.ratingCount).toLocaleString()})</span>
              ) : null}
            </span>
          ) : null}
        </div>
        {enrolled ? (
          <Link to={to} className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline [&_svg]:h-3.5 [&_svg]:w-3.5">
            View syllabus
            <ArrowRightIcon />
          </Link>
        ) : (
          <Link
            to={to}
            className="inline-flex w-full items-center justify-center rounded-xl bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand hover:bg-brand hover:text-white"
          >
            + Enroll now
          </Link>
        )}
      </div>
    </article>
  );
}

function DeadlineRow({ enrollment, urgent, dayLabel, timeLabel }) {
  return (
    <Link
      to={enrollmentLink(enrollment)}
      className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-hairline transition hover:ring-brand/25"
    >
      <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${urgent ? 'bg-wheat/20 text-wheat' : 'bg-brand-soft text-brand'}`}>
        {urgent ? <AlertIcon /> : <CheckIcon />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-bold text-charcoal">{enrollment.courseTitle}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${urgent ? 'bg-wheat/20 text-wheat-ink' : 'bg-brand-soft text-brand'}`}>
            {dayLabel}
          </span>
        </span>
        <span className="mt-0.5 block text-sm text-charcoal-muted">
          {timeLabel}
          {enrollment.categoryName ? ` · ${enrollment.categoryName}` : ''}
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
  const deadlines = active.filter((row) => (row.percent ?? 0) < 80).slice(0, 2);
  const left = featured ? lessonsLeft(featured.percent) : null;

  return (
    <div className="student-compact mx-auto w-full max-w-3xl space-y-5">
      <header className="space-y-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-charcoal sm:text-4xl">
            Welcome back, {firstName}!
          </h1>
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-bold text-brand ring-1 ring-brand/10">
            Undergraduate · Student
          </span>
        </div>

        {featured ? (
          <div className="mx-auto flex max-w-2xl items-start gap-2 rounded-2xl bg-brand-soft px-3 py-3 text-left text-sm text-brand ring-1 ring-brand/10 [&_svg]:mt-0.5 [&_svg]:h-4 [&_svg]:w-4">
            <LeafIcon />
            <div className="min-w-0">
              <p className="font-bold">Weekly Goal in Sight</p>
              <p className="mt-0.5 leading-snug text-brand/85">
                {left
                  ? `You're ${left} lesson${left === 1 ? '' : 's'} away from completing “${featured.courseTitle}”.`
                  : `Keep going in “${featured.courseTitle}”.`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-charcoal-muted">Browse curated courses and enroll to start learning.</p>
        )}
      </header>

      {featured ? (
        <section aria-labelledby="in-progress-heading" className="space-y-2.5">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">In progress</p>
              <h2 id="in-progress-heading" className="font-display text-lg font-bold text-charcoal sm:text-xl">
                {active.length} active course{active.length === 1 ? '' : 's'}
              </h2>
            </div>
            <Link to="/learn/my-learning" className="shrink-0 text-sm font-bold text-brand hover:underline">
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

      <section aria-labelledby="categories-heading" className="space-y-2.5">
        <div className="flex items-end justify-between gap-2">
          <h2 id="categories-heading" className="text-[11px] font-bold uppercase tracking-[0.16em] text-charcoal-muted">
            Categories
          </h2>
          <Link to="/learn/courses" className="text-sm font-bold text-brand hover:underline">
            View hierarchy
          </Link>
        </div>
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-0 sm:px-0">
          {(categories.length > 1 ? categories : ['All']).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                category === item
                  ? 'bg-brand text-white shadow-soft'
                  : 'bg-white text-charcoal ring-1 ring-hairline hover:bg-mint-soft'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="curated-heading" className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 id="curated-heading" className="font-display text-lg font-bold text-charcoal sm:text-xl">
              Curated For Your Degree
            </h2>
            <p className="mt-0.5 text-sm text-charcoal-muted">
              Recommended based on completed prerequisites
            </p>
          </div>
          <Link to="/learn/courses" className="shrink-0 text-sm font-bold text-brand hover:underline">
            Filter
          </Link>
        </div>

        {loading ? (
          <CardGridSkeleton count={3} />
        ) : curated.length ? (
          <ul className="space-y-3">
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
        <section aria-labelledby="deadlines-heading" className="space-y-2.5">
          <div className="flex items-end justify-between gap-2">
            <h2 id="deadlines-heading" className="font-display text-lg font-bold text-charcoal sm:text-xl">
              Upcoming Deadlines
            </h2>
            <p className="text-xs font-bold uppercase tracking-wide text-charcoal-muted">
              {deadlines.length} pending
            </p>
          </div>
          <ul className="space-y-2.5">
            {deadlines.map((row, index) => (
              <li key={row.id}>
                <DeadlineRow
                  enrollment={row}
                  urgent={index === 0}
                  dayLabel={index === 0 ? 'Due Tomorrow' : 'Friday'}
                  timeLabel={index === 0 ? '11:59 PM' : '5:00 PM'}
                />
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
