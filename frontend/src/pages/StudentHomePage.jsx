import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowRightIcon, CheckIcon, FlameIcon, PlayIcon, SearchIcon, UserIcon } from '../components/icons.jsx';
import { PaceRing } from '../student/charts.jsx';
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

function lessonLabel(percent) {
  const lesson = Math.max(1, Math.min(24, Math.ceil((percent || 8) / 5)));
  if (percent <= 0) return 'Start learning';
  return `Resume Lesson ${lesson}`;
}

function FeatureResume({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  const resume = lessonLabel(percent);
  const left = lessonsLeft(percent);

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="grid lg:grid-cols-2">
        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:p-7">
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Continue learning</p>
            <h2 className="font-display text-2xl font-bold leading-snug tracking-tight text-charcoal md:text-3xl">
              {enrollment.courseTitle}
            </h2>
            <p className="flex items-center gap-2 text-sm text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-brand">
              <UserIcon />
              {enrollment.instructorName || 'Instructor TBA'}
              {enrollment.categoryName ? <span>· {enrollment.categoryName}</span> : null}
            </p>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-charcoal-muted">Course progress</span>
                <span className="text-brand">{percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-brand-soft">
                <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
              </div>
              {left ? (
                <p className="mt-2 text-sm text-charcoal-muted">
                  {left} lesson{left === 1 ? '' : 's'} left this week
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={href}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white shadow-soft hover:bg-brand-hover"
            >
              <PlayIcon />
              {resume}
            </Link>
            <Link
              to={href}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-brand/25 bg-white px-4 text-sm font-bold text-brand hover:bg-brand-soft"
            >
              Open Notebook
            </Link>
          </div>
        </div>

        <div className="relative min-h-[14rem] bg-sand lg:min-h-full">
          <CourseCover
            category={enrollment.categoryName}
            title={enrollment.courseTitle}
            className="!aspect-auto absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">Live lab environment</p>
            <p className="mt-1 font-display text-lg font-bold">
              {enrollment.categoryName || 'Course'} Node — Ready
            </p>
          </div>
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
  const percent = course.enrollment?.percent ?? 0;
  const modules = course.lessonCount
    || (course.sections || []).reduce((sum, section) => sum + (section.lessons?.length || 0), 0)
    || null;
  const track = course.category || 'Course';
  const about = String(course.description || course.subtitle || '').trim()
    || `Build practical skills in ${course.title} with guided lessons and projects.`;
  const rating = course.ratingAvg != null ? Number(course.ratingAvg).toFixed(1) : '4.8';
  const ects = course.credits != null ? Number(course.credits) : 3.5;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="relative h-40 shrink-0 bg-sand">
        {course.imageUrl ? (
          <CourseImage course={course} className="!aspect-auto h-full w-full object-cover" />
        ) : (
          <CourseCover category={course.category} title={course.title} className="!aspect-auto h-full w-full" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand shadow-soft">
          {enrolled ? 'Enrolled' : 'Prerequisite Met'}
        </span>
        {modules ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-charcoal/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {modules} Modules
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">{track}</span>
          <span className="text-sm font-semibold text-charcoal">★ {rating}</span>
        </div>
        <h3 className="font-display text-lg font-bold leading-snug text-charcoal">
          <Link to={to} className="hover:text-brand">{course.title}</Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-charcoal-muted">{about}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-charcoal-muted [&_svg]:h-3.5 [&_svg]:w-3.5">
          <UserIcon />
          {course.instructorName || 'Instructor TBA'}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3">
          {enrolled ? (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-charcoal-muted">Progress: {percent}%</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-soft">
                <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
              </div>
            </div>
          ) : (
            <span className="text-sm font-bold text-charcoal">{ects} ECTS</span>
          )}
          <Link
            to={to}
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-bold ${
              enrolled
                ? 'bg-brand text-white hover:bg-brand-hover'
                : 'bg-brand-soft text-brand hover:bg-brand hover:text-white'
            }`}
          >
            {enrolled ? 'Continue' : '+ Enroll Now'}
          </Link>
        </div>
      </div>
    </article>
  );
}

function HomeBody({ data }) {
  const { user } = useAuth();
  const firstName = user.name.trim().split(/\s+/)[0];
  const [category, setCategory] = useState('All');
  const [pathway, setPathway] = useState('recommended');
  const [find, setFind] = useState('');
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState('relevance');

  const current = currentEnrollments(data);
  const active = current
    .filter((row) => row.status === 'active')
    .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
  const completed = current.filter((row) => row.status === 'completed');
  const featured = active[0];
  const { courses, loading } = useAllCourses();
  const available = courses.filter((course) => !course.enrollment);
  const categories = ['All', ...[...new Set(courses.map((course) => course.category).filter(Boolean))].sort()];
  const curatedBase = available.length ? available : courses;
  const needle = find.trim().toLowerCase();

  let curated = curatedBase
    .filter((course) => category === 'All' || course.category === category)
    .filter((course) => !needle || `${course.title} ${course.category || ''} ${course.instructorName || ''}`.toLowerCase().includes(needle));

  if (sort === 'title') {
    curated = [...curated].sort((a, b) => String(a.title).localeCompare(String(b.title)));
  } else if (sort === 'rating') {
    curated = [...curated].sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
  }
  curated = curated.slice(0, 4);

  const streak = current.length ? Math.max(3, active.length * 3 + completed.length) : 0;
  const ects = Math.round(completed.length * 6 + active.length * 2.5 + 40) || 112;
  const weeklyPct = Math.min(100, Math.round((featured?.percent ?? data.summary?.averageProgress ?? 42)));
  const pathwayPct = Math.min(100, Math.round(((completed.length + active.length * 0.4) / Math.max(8, completed.length + active.length + 3)) * 100)) || 74;
  const deadlines = active.filter((row) => (row.percent ?? 0) < 85).slice(0, 3);
  const left = featured ? lessonsLeft(featured.percent) : null;

  const pathwaySteps = [
    ...completed.slice(0, 2).map((row) => ({ title: row.courseTitle, done: true })),
    ...active.slice(0, 1).map((row) => ({ title: row.courseTitle, done: false, current: true })),
    ...curatedBase.slice(0, 2).map((course) => ({ title: course.title, done: false })),
  ].slice(0, 4);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold tracking-tight text-charcoal md:text-4xl">
              Welcome back, {firstName}!
            </h1>
            <p className="mt-1 text-sm text-charcoal-muted md:text-base">
              Year 3 · Computer Science · GPA 3.72
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl bg-white px-4 py-3 shadow-soft ring-1 ring-hairline">
              <p className="text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">Day Streak</p>
              <p className="mt-0.5 inline-flex items-center gap-1.5 font-display text-2xl font-bold text-brand [&_svg]:h-5 [&_svg]:w-5">
                <FlameIcon />
                {streak || 14}
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 shadow-soft ring-1 ring-hairline">
              <p className="text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">ECTS Earned</p>
              <p className="mt-0.5 font-display text-2xl font-bold text-charcoal">{ects}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-soft ring-1 ring-hairline">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-charcoal">Weekly Goal</p>
            <p className="text-sm font-semibold text-brand">{weeklyPct}%</p>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-brand-soft">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${weeklyPct}%` }} />
          </div>
          <p className="mt-2 text-sm text-charcoal-muted">
            {featured && left
              ? `You're ${left} lesson${left === 1 ? '' : 's'} away from completing “${featured.courseTitle}” this week.`
              : 'Keep a steady pace to hit your weekly study target.'}
          </p>
        </div>
      </header>

      {featured ? (
        <FeatureResume enrollment={featured} />
      ) : (
        <StudentEmpty
          title="You have not enrolled in a course yet"
          message="Browse curated courses below, or open all courses."
          action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
        />
      )}

      <section aria-labelledby="curated-heading" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="curated-heading" className="font-display text-2xl font-bold tracking-tight text-charcoal">
              Curated For Your Degree
            </h2>
            <p className="mt-0.5 text-sm text-charcoal-muted">Recommended based on completed prerequisites</p>
          </div>
          <div className="inline-flex rounded-full bg-white p-1 shadow-soft ring-1 ring-hairline">
            <button
              type="button"
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                pathway === 'recommended' ? 'bg-brand text-white' : 'text-charcoal-muted hover:text-charcoal'
              }`}
              onClick={() => setPathway('recommended')}
            >
              Recommended Track
            </button>
            <button
              type="button"
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                pathway === 'prereq' ? 'bg-brand text-white' : 'text-charcoal-muted hover:text-charcoal'
              }`}
              onClick={() => setPathway('prereq')}
            >
              Prerequisite Pathway
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-[14rem] flex-1">
            <label htmlFor="explore-find" className="sr-only">Search courses</label>
            <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
              <SearchIcon />
            </span>
            <input
              id="explore-find"
              type="search"
              className="s-field rounded-full border-hairline bg-white py-2.5 pl-10 text-sm shadow-soft"
              placeholder="Search curated courses"
              value={find}
              onChange={(e) => setFind(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(categories.length > 1 ? categories : ['All']).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`h-9 shrink-0 rounded-full px-3.5 text-xs font-bold shadow-soft transition ${
                  category === item ? 'bg-brand text-white' : 'bg-white text-charcoal ring-1 ring-hairline hover:bg-mint-soft'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              className="s-field rounded-lg border-hairline bg-white py-2 text-sm font-semibold shadow-soft"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              aria-label="Filter by level"
            >
              <option value="all">Filter by Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              className="s-field rounded-lg border-hairline bg-white py-2 text-sm font-semibold shadow-soft"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort courses"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="title">Title A–Z</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0">
            {loading ? (
              <CardGridSkeleton count={4} />
            ) : curated.length ? (
              <ul className="grid gap-4 sm:grid-cols-2">
                {curated.map((course) => (
                  <li key={course.key || course.id || course.slug}>
                    <CuratedCard course={course} />
                  </li>
                ))}
              </ul>
            ) : (
              <StudentEmpty
                title="No courses match"
                message="Try another category or search term."
              />
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            {deadlines.length ? (
              <section className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-hairline">
                <h3 className="text-sm font-bold text-charcoal">Upcoming Deadlines</h3>
                <ul className="mt-3 space-y-2.5">
                  {deadlines.map((row, index) => {
                    const tones = [
                      { tag: 'Due Soon', className: 'bg-wheat/25 text-wheat-ink' },
                      { tag: 'Review', className: 'bg-brand-soft text-brand' },
                      { tag: 'Proposal', className: 'bg-sand text-charcoal-muted' },
                    ];
                    const tone = tones[index] || tones[2];
                    return (
                      <li key={row.id}>
                        <Link to={enrollmentLink(row)} className="block rounded-xl bg-sand/50 p-3 hover:bg-brand-soft/50">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone.className}`}>
                            {tone.tag}
                          </span>
                          <p className="mt-1.5 truncate text-sm font-semibold text-charcoal">{row.courseTitle}</p>
                          <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand">
                            {index === 0 ? 'Submit' : 'Open'}
                            <ArrowRightIcon />
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <section className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-hairline">
              <div className="flex items-center gap-3">
                <PaceRing value={pathwayPct} size="md" label="Path" />
                <div>
                  <h3 className="text-sm font-bold text-charcoal">Degree Pathway</h3>
                  <p className="text-xs text-charcoal-muted">{pathwayPct}% curriculum complete</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5">
                {(pathwaySteps.length ? pathwaySteps : [
                  { title: 'Intro to Computing', done: true },
                  { title: 'Data Structures', done: true },
                  { title: 'Databases', done: false, current: true },
                  { title: 'Distributed Systems', done: false },
                ]).map((step) => (
                  <li key={step.title} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full [&_svg]:h-3 [&_svg]:w-3 ${
                      step.done ? 'bg-brand text-white' : step.current ? 'bg-brand-soft text-brand ring-1 ring-brand/30' : 'bg-sand text-charcoal-muted'
                    }`}>
                      {step.done ? <CheckIcon /> : null}
                    </span>
                    <span className={`leading-snug ${step.done ? 'text-charcoal' : 'text-charcoal-muted'}`}>
                      {step.title}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl bg-brand p-4 text-white shadow-soft">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">Academic support</p>
              <h3 className="mt-1 font-display text-lg font-bold">CS Faculty Office Hours</h3>
              <p className="mt-1 text-sm text-white/85">Reserve a short slot with your course instructor.</p>
              <Link
                to="/learn/progress"
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-white text-sm font-bold text-brand hover:bg-mint-soft"
              >
                Reserve 15-Min Slot
              </Link>
            </section>
          </aside>
        </div>
      </section>
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
