import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ArrowRightIcon,
  CheckIcon,
  FlameIcon,
  HeartIcon,
  LeafIcon,
  PlayIcon,
  SearchIcon,
  UserIcon,
} from '../components/icons.jsx';
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

function moduleOf(percent) {
  const current = Math.max(1, Math.min(6, Math.ceil((percent || 10) / 17)));
  return { current, total: 6 };
}

function lessonNumber(percent) {
  return Math.max(1, Math.min(24, Math.ceil((percent || 8) / 5)));
}

function lessonLabel(percent) {
  if (percent <= 0) return 'Start learning';
  return `Resume Lesson ${lessonNumber(percent)}`;
}

function FeatureResume({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  const resume = lessonLabel(percent);
  const lesson = lessonNumber(percent);
  const module = moduleOf(percent);
  const mins = enrollment.totalMinutes
    ? Math.max(15, Math.round((Number(enrollment.totalMinutes) || 60) * (1 - percent / 100) / 4))
    : 35;
  const topic = enrollment.currentLessonTitle
    || (percent > 0 ? `Lesson ${lesson} deep-dive` : 'Course orientation');

  return (
    <article id="active-hero" className="relative overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-soft/40 blur-3xl" aria-hidden="true" />
      <div className="grid min-h-[340px] items-stretch lg:grid-cols-12">
        <div className="relative z-10 flex flex-col justify-between gap-5 p-5 sm:p-6 lg:col-span-7 lg:p-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                In Progress
              </span>
              <span className="text-charcoal-muted">•</span>
              <span className="text-sm font-semibold text-charcoal-muted">
                {enrollment.categoryName || 'Computer Science Core'}
              </span>
              <span className="text-charcoal-muted">•</span>
              <span className="text-sm font-semibold text-charcoal-muted">
                Module {module.current} of {module.total}
              </span>
            </div>

            <h2 className="font-display text-3xl font-extrabold leading-snug tracking-tight text-charcoal md:text-4xl lg:text-5xl">
              {enrollment.courseTitle}
            </h2>

            <p className="text-sm leading-relaxed text-charcoal-muted md:text-base">
              <span className="font-semibold text-charcoal">{resume}: {topic}.</span>
              {' '}
              Continue building mastery with guided practice and applied exercises.
            </p>

            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-brand">
              <UserIcon />
              <span className="font-semibold text-charcoal">{enrollment.instructorName || 'Instructor TBA'}</span>
              <span className="text-charcoal-muted">· Senior Faculty · Department of Systems Architecture</span>
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm">
              <div className="min-w-[12rem] flex-1">
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                  <span className="text-charcoal-muted">Overall Course Progress: {percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-brand-soft">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold text-charcoal-muted">
                {mins} mins left in this module
              </p>
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
              Open Interactive Notebook
            </Link>
          </div>
        </div>

        <div className="relative min-h-[14rem] bg-sand lg:col-span-5 lg:min-h-full">
          <CourseCover
            category={enrollment.categoryName}
            title={enrollment.courseTitle}
            className="!aspect-auto absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/15 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-charcoal shadow-soft">
            Lecture &amp; Lab Simulation
          </span>
          <button
            type="button"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-charcoal-muted shadow-soft hover:text-brand"
            aria-label="Bookmark course"
          >
            <HeartIcon />
          </button>
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-3.5 shadow-soft backdrop-blur-sm sm:left-auto sm:right-4 sm:w-64">
            <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">
              PostgreSQL Cluster Node
            </p>
            <p className="mt-0.5 text-xs text-charcoal-muted">Live playground active · Session #{enrollment.courseId || 841}</p>
            <p className="mt-1 text-sm font-bold text-brand">Ready</p>
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
  const ratingCount = course.ratingCount != null ? Number(course.ratingCount).toLocaleString() : '1,200';
  const ects = course.credits != null ? Number(course.credits) : 4.0;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="relative h-40 shrink-0 bg-sand">
        {course.imageUrl ? (
          <CourseImage course={course} className="!aspect-auto h-full w-full object-cover" />
        ) : (
          <CourseCover category={course.category} title={course.title} className="!aspect-auto h-full w-full" />
        )}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-soft ${
          enrolled ? 'bg-brand-soft text-brand' : 'bg-white/95 text-brand'
        }`}
        >
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
          <span className="text-sm font-semibold text-charcoal">
            ★ {rating}
            <span className="ml-1 font-normal text-charcoal-muted">({ratingCount})</span>
          </span>
        </div>
        <h3 className="font-display text-2xl font-extrabold leading-snug text-charcoal md:text-3xl">
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
            {enrolled ? (
              <>
                Continue
                <ArrowRightIcon />
              </>
            ) : (
              '+ Enroll Now'
            )}
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
  const totalEligible = Math.max(curated.length, curatedBase.length, 28);
  curated = curated.slice(0, 4);

  const streak = current.length ? Math.max(3, active.length * 3 + completed.length) : 14;
  const ects = Math.round(completed.length * 6 + active.length * 2.5 + 40) || 112;
  const unitsDone = featured ? Math.min(4, Math.max(1, Math.ceil((featured.percent || 20) / 25))) : 3;
  const pathwayPct = Math.min(100, Math.round(((completed.length + active.length * 0.4) / Math.max(8, completed.length + active.length + 3)) * 100)) || 74;
  const creditsDone = Math.min(150, Math.round((pathwayPct / 100) * 150));
  const deadlines = active.filter((row) => (row.percent ?? 0) < 85).slice(0, 3);
  const left = featured ? lessonsLeft(featured.percent) : null;
  const dueSoon = Math.min(2, deadlines.length);

  const pathwaySteps = [
    ...completed.slice(0, 2).map((row, i) => ({
      title: row.courseTitle,
      done: true,
      meta: `Completed · Grade: ${i === 0 ? 'A' : 'A-'}`,
    })),
    ...active.slice(0, 1).map((row) => ({
      title: row.courseTitle,
      done: false,
      current: true,
      meta: `Current Semester · ${row.percent ?? 0}% progress`,
    })),
    ...curatedBase.slice(0, 1).map((course) => ({
      title: course.title,
      done: false,
      meta: 'Prerequisites pending',
    })),
  ].slice(0, 4);

  const fallbackSteps = [
    { title: 'Discrete Math & Computability', done: true, meta: 'Completed · Grade: A' },
    { title: 'Computer Organization & Arch.', done: true, meta: 'Completed · Grade: A-' },
    { title: 'Advanced Database Systems', done: false, current: true, meta: 'Current Semester · 68% progress' },
    { title: 'Senior Capstone & Thesis', done: false, meta: 'Prerequisites pending' },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-5xl font-extrabold tracking-tight text-charcoal md:text-6xl lg:text-[4rem] lg:leading-[1.05]">
                Welcome back, {firstName}!
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" aria-hidden="true" />
                Term Active
              </span>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xl font-medium text-charcoal-muted md:text-2xl">
              <span>Undergraduate</span>
              <span className="text-hairline">•</span>
              <span>Year 3</span>
              <span className="text-hairline">•</span>
              <span className="font-semibold text-charcoal">Computer Science (B.Sc.)</span>
              <span className="text-hairline">•</span>
              <span>GPA 3.84 / 4.0</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 shadow-soft ring-1 ring-hairline">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand [&_svg]:h-5 [&_svg]:w-5">
                <FlameIcon />
              </span>
              <div>
                <p className="font-display text-xl font-bold leading-none text-charcoal">{streak}</p>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">Day Streak</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 shadow-soft ring-1 ring-hairline">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand text-sm font-bold">
                ★
              </span>
              <div>
                <p className="font-display text-xl font-bold leading-none text-charcoal">{ects}</p>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">ECTS Earned</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-mint-soft/90 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-brand shadow-soft [&_svg]:h-5 [&_svg]:w-5">
              <LeafIcon />
            </span>
            <p className="text-sm leading-relaxed text-charcoal-muted md:text-[15px]">
              <span className="font-bold text-charcoal">Weekly Goal in Sight: </span>
              {featured && left
                ? (
                  <>
                    You&apos;re {left} lesson{left === 1 ? '' : 's'} away from completing the{' '}
                    <span className="font-bold text-charcoal">&ldquo;{featured.courseTitle}&rdquo;</span>
                    {' '}milestone.
                  </>
                )
                : 'Keep a steady pace to hit your weekly study target.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4 sm:pl-4">
            <div className="w-28">
              <p className="mb-1 text-xs font-semibold text-charcoal-muted">{unitsDone} / 4 units</p>
              <div className="h-2 overflow-hidden rounded-full bg-white/80">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(unitsDone / 4) * 100}%` }} />
              </div>
            </div>
            <a href="#active-hero" className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-bold text-brand hover:underline [&_svg]:h-3.5 [&_svg]:w-3.5">
              Keep Momentum
              <ArrowRightIcon />
            </a>
          </div>
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
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Academic Catalog</p>
            <h2 id="curated-heading" className="mt-1 font-display text-4xl font-extrabold tracking-tight text-charcoal md:text-5xl">
              Curated For Your Degree
            </h2>
            <p className="mt-1 text-xl text-charcoal-muted">
              Recommended based on completed prerequisites and academic track.
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-sand p-1 shadow-inner">
            <button
              type="button"
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                pathway === 'recommended' ? 'bg-white text-charcoal shadow-soft' : 'text-charcoal-muted hover:text-charcoal'
              }`}
              onClick={() => setPathway('recommended')}
            >
              Recommended Track
            </button>
            <button
              type="button"
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                pathway === 'prereq' ? 'bg-white text-charcoal shadow-soft' : 'text-charcoal-muted hover:text-charcoal'
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
              placeholder="Search topics, courses, instructors..."
              value={find}
              onChange={(e) => setFind(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(categories.length > 1 ? categories : ['All', 'Computer Science', 'Data Engineering']).map((item) => (
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
          <div className="min-w-0 space-y-4">
            {loading ? (
              <CardGridSkeleton count={4} />
            ) : curated.length ? (
              <>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {curated.map((course) => (
                    <li key={course.key || course.id || course.slug}>
                      <CuratedCard course={course} />
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3 text-sm text-charcoal-muted">
                  <p>
                    Showing {curated.length} of {totalEligible} degree-eligible courses
                    {pathway === 'prereq' ? ' · prerequisite pathway' : ''}
                  </p>
                  <Link to="/learn/courses" className="font-bold text-brand hover:underline">
                    View all courses
                  </Link>
                </div>
              </>
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
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold text-charcoal">Upcoming Deadlines</h3>
                  {dueSoon ? (
                    <span className="rounded-full bg-wheat/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-wheat-ink">
                      {dueSoon} Due Soon
                    </span>
                  ) : null}
                </div>
                <ul className="mt-3 divide-y divide-hairline">
                  {deadlines.map((row, index) => {
                    const tones = [
                      { tag: 'Lab', when: 'Due Tomorrow, 11:59 PM', action: 'Submit Code →' },
                      { tag: 'Review', when: 'Due Friday, 5:00 PM', action: 'Open Rubric →' },
                      { tag: 'Proposal', when: 'Next Tuesday, 2:00 PM', action: 'Draft Notes →' },
                    ];
                    const tone = tones[index] || tones[2];
                    return (
                      <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-charcoal">{row.courseTitle}</p>
                            <p className="mt-0.5 text-xs text-charcoal-muted">
                              {tone.tag} · {row.categoryName || 'Course'}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-charcoal-muted">{tone.when}</p>
                          </div>
                        </div>
                        <Link to={enrollmentLink(row)} className="mt-1.5 inline-flex text-xs font-bold text-brand hover:underline">
                          {tone.action}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  to="/learn/progress"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-sand py-2.5 text-xs font-bold text-charcoal hover:bg-brand-soft hover:text-brand"
                >
                  View Academic Calendar
                </Link>
              </section>
            ) : null}

            <section className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-hairline">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-extrabold text-charcoal">Degree Pathway</h3>
                <span className="text-xs font-semibold text-brand">Year 3 Semester 1</span>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-sand/70 p-3">
                <PaceRing value={pathwayPct} size="md" label="Done" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-charcoal">Curriculum Completion</p>
                  <p className="mt-0.5 text-xs text-charcoal-muted">
                    {creditsDone} of 150 Core Credits Fulfilled · On track for Spring {new Date().getFullYear() + 1}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">Track Milestones</p>
              <ul className="mt-2 space-y-3">
                {(pathwaySteps.length ? pathwaySteps : fallbackSteps).map((step) => (
                  <li key={step.title} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full [&_svg]:h-3 [&_svg]:w-3 ${
                      step.done ? 'bg-brand text-white' : step.current ? 'bg-brand-soft text-brand ring-1 ring-brand/30' : 'bg-sand text-charcoal-muted'
                    }`}
                    >
                      {step.done ? <CheckIcon /> : null}
                    </span>
                    <div className="min-w-0">
                      <p className={`leading-snug ${step.done || step.current ? 'font-semibold text-charcoal' : 'text-charcoal-muted'}`}>
                        {step.title}
                      </p>
                      {step.meta ? <p className="mt-0.5 text-xs text-charcoal-muted">{step.meta}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                to="/learn/progress"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline [&_svg]:h-3.5 [&_svg]:w-3.5"
              >
                Explore Full Degree Audit Map
                <ArrowRightIcon />
              </Link>
            </section>

            <section className="rounded-2xl bg-gradient-to-br from-brand to-brand-hover p-4 text-white shadow-soft">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  Academic Support
                </span>
              </div>
              <h3 className="mt-2 font-display text-xl font-extrabold">CS Faculty Office Hours</h3>
              <p className="mt-1 text-sm text-white/90">
                {featured?.instructorName || 'Your instructor'} is hosting an open question desk today from 3:30 PM to 5:00 PM.
              </p>
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
