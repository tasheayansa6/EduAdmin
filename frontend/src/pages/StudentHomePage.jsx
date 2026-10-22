import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AlertIcon, CheckIcon, ClockIcon, LeafIcon, PlayIcon } from '../components/icons.jsx';
import { currentEnrollments, useAllCourses, useDocumentTitle, useStudentData } from '../student/StudentData.jsx';
import {
  CardGridSkeleton,
  CourseCover,
  CourseImage,
  StudentData,
  StudentEmpty,
  enrollmentLink,
  formatMinutes,
  formatPrice,
} from '../student/components.jsx';

function lessonsLeft(percent) {
  if (percent == null) return null;
  const left = Math.max(1, Math.ceil((100 - percent) / 12));
  return left;
}

function ResumeCard({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  const mins = enrollment.totalMinutes
    ? Math.max(15, Math.round((Number(enrollment.totalMinutes) || 60) * (1 - percent / 100) / 4))
    : 35;
  const resumeLabel = percent > 0 ? `Resume ${enrollment.courseTitle}` : `Start ${enrollment.courseTitle}`;

  return (
    <article className="overflow-hidden rounded-[1.75rem] bg-white shadow-lift ring-1 ring-hairline">
      <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[2/1]">
        <CourseCover
          category={enrollment.categoryName}
          title={enrollment.courseTitle}
          className="!aspect-auto absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand via-brand/55 to-transparent" />
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-charcoal shadow-soft [&_svg]:h-3.5 [&_svg]:w-3.5">
          <ClockIcon />
          {mins} mins left
        </span>
        <div className="absolute inset-x-0 bottom-0 space-y-1 p-4 text-white sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-wheat">
            {enrollment.categoryName || 'In progress'}
            {percent ? ` · ${percent}%` : ''}
          </p>
          <p className="font-display text-xl font-bold leading-snug sm:text-2xl">
            {percent > 0 ? 'Resume lesson' : 'Start learning'}
          </p>
          <p className="text-sm text-white/85 line-clamp-1">{enrollment.courseTitle}</p>
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold leading-snug text-charcoal">
              {enrollment.courseTitle}
            </h3>
            <p className="mt-1 text-sm text-charcoal-muted">
              {enrollment.instructorName || 'Instructor TBA'}
            </p>
          </div>
          <p className="shrink-0 text-sm font-bold text-brand">{percent}% Completed</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-brand-soft">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
        </div>
        <Link
          to={href}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3.5 text-sm font-bold text-white shadow-soft hover:bg-brand-hover"
        >
          <PlayIcon />
          <span className="truncate">{resumeLabel}</span>
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

  return (
    <article className="overflow-hidden rounded-[1.5rem] bg-white shadow-soft ring-1 ring-hairline">
      <div className="relative aspect-[16/10] bg-sand">
        {course.imageUrl ? (
          <CourseImage course={course} className="!aspect-auto h-full w-full" />
        ) : (
          <CourseCover category={course.category} title={course.title} className="!aspect-auto h-full w-full" />
        )}
        <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand shadow-soft">
            {course.category || 'Course'}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {modules ? (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-charcoal shadow-soft">
                {modules} modules
              </span>
            ) : null}
            {enrolled ? (
              <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-soft">
                Enrolled
              </span>
            ) : (
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold text-brand shadow-soft">
                Prerequisite met
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-display text-[1.05rem] font-bold leading-snug text-charcoal">
            <Link to={to} className="hover:text-brand">{course.title}</Link>
          </h3>
          <p className="mt-1 text-sm text-charcoal-muted">
            {course.instructorName || 'Instructor TBA'}
            {course.totalMinutes ? ` · ${formatMinutes(course.totalMinutes)}` : ''}
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
        <Link
          to={to}
          className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold ${
            enrolled
              ? 'bg-brand-soft text-brand hover:bg-brand hover:text-white'
              : 'bg-brand text-white hover:bg-brand-hover'
          }`}
        >
          {enrolled ? 'View syllabus' : '+ Enroll now'}
        </Link>
      </div>
    </article>
  );
}

function DeadlineRow({ enrollment, urgent, dayLabel, timeLabel }) {
  return (
    <Link
      to={enrollmentLink(enrollment)}
      className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-hairline transition hover:ring-brand/30"
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
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-[1.85rem] font-bold leading-tight tracking-tight text-charcoal sm:text-4xl">
            Welcome back, {firstName}!
          </h1>
          <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white">
            Undergraduate · Student
          </span>
        </div>

        {featured ? (
          <div className="flex items-start gap-2.5 rounded-2xl bg-brand-soft px-4 py-3.5 text-sm text-brand ring-1 ring-brand/10 [&_svg]:mt-0.5 [&_svg]:h-4 [&_svg]:w-4">
            <LeafIcon />
            <div>
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
        <section aria-labelledby="resume-heading">
          <h2 id="resume-heading" className="sr-only">Continue learning</h2>
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
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(categories.length > 1 ? categories : ['All']).map((item) => (
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

        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="curated-heading" className="font-display text-xl font-bold text-charcoal sm:text-2xl">
              Curated For Your Degree
            </h2>
            <p className="mt-1 text-sm text-charcoal-muted">
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
            <p className="text-xs font-bold uppercase tracking-wide text-charcoal-muted">
              {deadlines.length} pending
            </p>
          </div>
          <ul className="space-y-3">
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
