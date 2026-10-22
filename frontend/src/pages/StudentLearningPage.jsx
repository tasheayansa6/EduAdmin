import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  FlameIcon,
  HeartIcon,
  SearchIcon,
  ShieldIcon,
  UserIcon,
} from '../components/icons.jsx';
import { PaceRing } from '../student/charts.jsx';
import { currentEnrollments, useDocumentTitle, useStore, useStudentData } from '../student/StudentData.jsx';
import {
  CourseCover,
  StudentData,
  StudentEmpty,
  enrollmentLink,
} from '../student/components.jsx';

const TABS = [
  { key: 'active', label: 'In Progress', test: (row) => row.status === 'active' },
  { key: 'completed', label: 'Completed', test: (row) => row.status === 'completed' },
  { key: 'favorites', label: 'Bookmarked', test: null },
  { key: 'all', label: 'All Enrollments', test: () => true },
];

function courseCode(enrollment) {
  const raw = String(enrollment.categoryName || enrollment.courseTitle || 'CRS')
    .replace(/[^A-Za-z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/);
  const letters = raw.map((w) => w[0]).join('').slice(0, 3).toUpperCase() || 'CRS';
  const id = String(enrollment.courseId || enrollment.id || 402).slice(-3).padStart(3, '0');
  return `${letters}-${id}`;
}

function deptLabel(enrollment) {
  if (!enrollment.categoryName) return 'ENROLLED COURSE';
  return `Dept. of ${enrollment.categoryName}`;
}

function statusBadge(percent, completed) {
  if (completed || percent >= 100) return { label: 'Completed', tone: 'bg-brand-soft text-brand' };
  if (percent >= 55) return { label: 'In Progress', tone: 'bg-brand-soft text-brand' };
  if (percent >= 25) return { label: 'Quiz Due in 2d', tone: 'bg-wheat/25 text-wheat-ink' };
  if (percent > 0) return { label: 'Lab Ready', tone: 'bg-sand text-charcoal-muted' };
  return { label: 'Ready', tone: 'bg-sand text-charcoal-muted' };
}

function lessonsDone(percent) {
  const total = 18;
  const done = Math.round((Math.max(0, Math.min(100, percent)) / 100) * total);
  return { done, total };
}

function lastActiveLabel(percent) {
  if (percent >= 100) return 'Course complete';
  if (percent >= 60) return 'Last active yesterday';
  if (percent >= 35) return 'Last active 3 days ago';
  if (percent > 0) return 'Last active last week';
  return 'Not started yet';
}

function moduleLine(percent) {
  if (percent >= 100) return 'Course wrap-up';
  if (percent >= 55) return 'Module 4: Concurrency & Locks';
  if (percent >= 25) return 'Hook Lifecycles';
  return 'Bayes Theorem Lab';
}

function nextLessonLabel(percent) {
  if (percent >= 100) return 'Review complete course';
  if (percent >= 55) return 'Lesson 4.3 — Distributed Indexing';
  if (percent >= 25) return 'Component Trees & Context';
  return 'Discrete Distributions';
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 19h14" />
    </svg>
  );
}

function HubCard({ enrollment, bookmarked, onToggleBookmark }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  const code = courseCode(enrollment);
  const completed = enrollment.status === 'completed' || percent >= 100;
  const badge = statusBadge(percent, completed);
  const lessons = lessonsDone(percent);
  const credits = enrollment.credits != null ? Number(enrollment.credits).toFixed(1) : '4.0';

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-sand sm:h-auto sm:min-h-[14rem] sm:w-52 md:w-60 lg:w-64">
          <CourseCover
            category={enrollment.categoryName}
            title={enrollment.courseTitle}
            className="!aspect-auto absolute inset-0 h-full w-full"
          />
          <span className="absolute left-3 top-3 rounded-md bg-charcoal/80 px-2.5 py-1 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {code}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-3.5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">
                {deptLabel(enrollment)}
              </p>
              <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide ${badge.tone}`}>
                {badge.label}
              </span>
            </div>

            <div>
              <h2 className="font-display text-3xl font-extrabold leading-snug tracking-tight text-charcoal md:text-4xl">
                <Link to={href} className="hover:text-brand">{enrollment.courseTitle}</Link>
              </h2>
              <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xl text-charcoal-muted">
                <span className="inline-flex items-center gap-1.5 [&_svg]:h-5 [&_svg]:w-5">
                  <UserIcon />
                  {enrollment.instructorName || 'Instructor TBA'}
                </span>
                <span aria-hidden="true">•</span>
                <span className="font-bold text-charcoal">
                  {credits} Academic Credits
                </span>
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-lg font-bold">
                <span className="text-charcoal">Syllabus Completion</span>
                <span className="font-extrabold text-brand">
                  {percent}%{' '}
                  <span className="font-semibold text-charcoal-muted">
                    ({lessons.done}/{lessons.total} lessons)
                  </span>
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-brand-soft">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-hairline bg-sand/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0 text-lg leading-relaxed text-charcoal-muted">
              <p>
                {lastActiveLabel(percent)}
                {!completed ? (
                  <>
                    {' • '}
                    <span className="font-semibold text-charcoal">{moduleLine(percent)}</span>
                  </>
                ) : null}
              </p>
              {!completed ? (
                <p className="mt-1 text-lg font-bold text-charcoal">
                  Next: {nextLessonLabel(percent)}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className={`grid h-12 w-12 place-items-center rounded-full transition ${
                  bookmarked ? 'bg-brand-soft text-brand' : 'bg-white text-charcoal-muted ring-1 ring-hairline hover:text-brand'
                }`}
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark course'}
                aria-pressed={bookmarked}
                onClick={onToggleBookmark}
              >
                <HeartIcon filled={bookmarked} />
              </button>
              <Link
                to={href}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-xl font-bold text-white shadow-soft hover:bg-brand-hover"
              >
                Continue Learning
                <span className="[&_svg]:h-4 [&_svg]:w-4"><ArrowRightIcon /></span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function OfflinePack({ enrollment, index }) {
  const href = enrollmentLink(enrollment);
  const code = courseCode(enrollment);
  const packs = [
    { title: `${code} Midterm Reading Pack`, detail: 'Includes 4 PDFs & SQL Lab Datasets', size: '42.8 MB', synced: 'Synced Oct 18' },
    { title: `${code} Architecture Cheatsheet`, detail: 'React 19 & Tailwind Component Patterns', size: '12.4 MB', synced: 'Synced Oct 14' },
    { title: `${code} Lab Dataset Bundle`, detail: 'CSV samples & notebook starter', size: '8.2 MB', synced: 'Synced Oct 12' },
  ];
  const pack = packs[index % packs.length];

  return (
    <div className="flex items-start gap-3 rounded-xl bg-sand/70 p-3.5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-brand shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-extrabold text-charcoal md:text-lg">{pack.title}</p>
        <p className="mt-0.5 line-clamp-2 text-base text-charcoal-muted">{pack.detail}</p>
        <p className="mt-1 text-xs font-semibold text-charcoal-muted">{pack.size} • {pack.synced}</p>
      </div>
      <Link
        to={href}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand ring-1 ring-hairline hover:bg-brand hover:text-white"
        aria-label={`Download ${pack.title}`}
      >
        <DownloadIcon />
      </Link>
    </div>
  );
}

function MilestoneRow({ title, course, code, dayLabel, timeLabel, urgent }) {
  return (
    <div className="border-b border-hairline py-3.5 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs font-bold uppercase tracking-wide ${urgent ? 'text-wheat-ink' : 'text-charcoal-muted'}`}>
          {dayLabel} {timeLabel}
        </span>
      </div>
      <h4 className="mt-1.5 text-lg font-extrabold leading-snug text-charcoal">{title}</h4>
      <p className="mt-1 text-base text-charcoal-muted">
        {code} • {course}
      </p>
    </div>
  );
}

function LearningBody({ data }) {
  const [params, setParams] = useSearchParams();
  const { favorites, setFavorite } = useStore();
  const [busyId, setBusyId] = useState(null);
  const [track, setTrack] = useState('all');
  const [sort, setSort] = useState('recent');
  const rows = currentEnrollments(data);
  const active = rows.filter((row) => row.status === 'active');
  const completed = rows.filter((row) => row.status === 'completed');
  const avg = data.summary?.averageProgress;
  const tabKey = params.get('tab') || 'active';
  const tab = TABS.find((item) => item.key === tabKey) ?? TABS[0];
  const filter = params.get('find') || '';
  const needle = filter.trim().toLowerCase();
  const year = new Date().getFullYear();
  const hoursTarget = 6;
  const hoursDone = Math.round(((Number(avg) || 75) / 100) * hoursTarget * 10) / 10;
    const ringValue = (avg ?? Math.round((hoursDone / hoursTarget) * 100)) || 75;
  const streak = rows.length ? Math.max(active.length * 2 || 1, completed.length ? 2 : 1, 5) : 0;

  const tracks = useMemo(() => {
    const set = new Set(rows.map((row) => row.categoryName).filter(Boolean));
    return ['all', ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const favoriteIds = new Set(
    favorites.map((item) => String(item.courseId ?? item.id ?? item.slug ?? '')),
  );

  let visible;
  if (tab.key === 'favorites') {
    visible = favorites
      .filter((item) => !needle || `${item.title} ${item.category || ''}`.toLowerCase().includes(needle))
      .sort((a, b) => String(a.title).localeCompare(String(b.title)));
  } else {
    visible = rows
      .filter(tab.test)
      .filter((row) => !needle || `${row.courseTitle} ${row.categoryName || ''} ${row.instructorName || ''}`.toLowerCase().includes(needle))
      .filter((row) => track === 'all' || row.categoryName === track);

    if (sort === 'title') {
      visible = [...visible].sort((a, b) => String(a.courseTitle).localeCompare(String(b.courseTitle)));
    } else if (sort === 'progress') {
      visible = [...visible].sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
    } else if (sort === 'deadlines') {
      visible = [...visible].sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0));
    } else {
      visible = [...visible].sort((a, b) => new Date(b.enrolledAt || 0) - new Date(a.enrolledAt || 0) || (b.percent ?? 0) - (a.percent ?? 0));
    }
  }

  function update(key, value, fallback) {
    const next = new URLSearchParams(params);
    if (!value || value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  async function toggleBookmark(enrollment) {
    const courseId = enrollment.courseId || enrollment.id;
    const key = String(courseId);
    const on = !favoriteIds.has(key);
    setBusyId(key);
    try {
      await setFavorite(
        enrollment.courseSlug
          ? { slug: enrollment.courseSlug, title: enrollment.courseTitle }
          : { local: true, id: courseId, courseId, title: enrollment.courseTitle },
        on,
      );
    } finally {
      setBusyId(null);
    }
  }

  const counts = {
    active: active.length,
    completed: completed.length,
    favorites: favorites.length,
    all: rows.length,
  };

  const milestones = active.slice(0, 2).map((row, index) => ({
    id: row.id,
    title: index === 0 ? 'Relational Schema Normalization Lab' : 'State Machine & Redux Quiz',
    course: row.courseTitle,
    code: courseCode(row),
    dayLabel: index === 0 ? 'Due Tomorrow' : 'Friday',
    timeLabel: index === 0 ? '11:59 PM' : '5:00 PM',
    urgent: index === 0,
  }));

  const offlineCount = Math.min(3, active.length || 2);

  return (
    <div className="space-y-7 md:space-y-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2.5">
          <nav aria-label="Breadcrumb" className="text-base font-bold text-charcoal-muted">
            Academic Session {year}–{year + 1}
            <span className="mx-1.5 text-hairline">/</span>
            <span className="text-brand">My Learning Hub</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-charcoal md:text-6xl lg:text-[4rem] lg:leading-[1.05]">
              My Learning Hub
            </h1>
            {streak ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3.5 py-1.5 text-lg font-bold uppercase tracking-wide text-brand [&_svg]:h-5 [&_svg]:w-5">
                <FlameIcon />
                {streak}-Day Streak
              </span>
            ) : null}
          </div>
          <p className="text-xl font-medium text-charcoal-muted md:text-2xl">
            Spring {year + 1} • Year 3 Undergraduate • Department of Computer Science
          </p>
        </div>

        {(active.length || completed.length) ? (
          <div className="flex w-full max-w-md items-center gap-4 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-hairline lg:w-[24rem]">
            <PaceRing value={ringValue} size="md" label="Done" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-charcoal-muted">Weekly Target</p>
              <p className="mt-1 font-display text-3xl font-extrabold leading-snug text-charcoal">
                {hoursDone} of {hoursTarget} hrs
              </p>
              <p className="mt-0.5 text-base text-charcoal-muted">Keep the momentum!</p>
              <Link
                to="/learn/progress"
                className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-lg bg-brand px-4 text-base font-bold text-white hover:bg-brand-hover"
              >
                Schedule
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter courses" className="flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((item) => {
            const selected = item.key === tab.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={selected}
                className={`shrink-0 rounded-full px-5 py-3 text-xl font-bold transition ${
                  selected ? 'bg-brand text-white shadow-soft' : 'bg-white text-charcoal ring-1 ring-hairline hover:bg-mint-soft'
                }`}
                onClick={() => update('tab', item.key, 'active')}
              >
                {item.label}
                {item.key !== 'all' ? (
                  <span className={`ml-1.5 tabular-nums ${selected ? 'text-white/85' : 'text-charcoal-muted'}`}>
                    {counts[item.key]}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:w-64">
            <label htmlFor="my-learning-find" className="sr-only">Search enrolled courses</label>
            <span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
              <SearchIcon />
            </span>
            <input
              id="my-learning-find"
              type="search"
              className="s-field rounded-full border-transparent bg-white py-3 pl-11 pr-14 text-lg shadow-soft"
              placeholder="Search courses, topics, or faculty..."
              value={filter}
              onChange={(event) => update('find', event.target.value)}
            />
            <kbd className="pointer-events-none absolute inset-y-0 right-3 my-auto hidden h-7 items-center rounded-md bg-sand px-1.5 text-xs font-bold text-charcoal-muted sm:inline-flex">
              ⌘K
            </kbd>
          </div>

          {tab.key !== 'favorites' ? (
            <>
              <label className="relative">
                <span className="sr-only">Track</span>
                <select
                  className="s-field appearance-none rounded-full border-hairline bg-white py-3 pl-4 pr-10 text-lg font-bold"
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                >
                  <option value="all">All Tracks</option>
                  {tracks.filter((item) => item !== 'all').map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2.5 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
                  <ChevronDownIcon />
                </span>
              </label>
              <label className="relative">
                <span className="sr-only">Sort</span>
                <select
                  className="s-field appearance-none rounded-full border-hairline bg-white py-3 pl-4 pr-10 text-lg font-bold"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="recent">Recently Accessed</option>
                  <option value="progress">Highest Progress</option>
                  <option value="deadlines">Upcoming Deadlines</option>
                  <option value="title">Title A–Z</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2.5 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
                  <ChevronDownIcon />
                </span>
              </label>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div aria-live="polite" className="min-w-0">
          {tab.key === 'favorites' ? (
            visible.length ? (
              <ul className="space-y-5">
                {visible.map((item) => {
                  const to = item.local || !item.slug
                    ? `/learn/my-courses/${item.courseId ?? item.id}`
                    : `/learn/courses/${item.slug}`;
                  return (
                    <li key={item.key || item.slug || item.courseId}>
                      <article className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-hairline">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand">
                          {item.category || 'Bookmarked'}
                        </p>
                        <h2 className="mt-1.5 font-display text-2xl font-extrabold md:text-3xl">
                          <Link to={to} className="hover:text-brand">{item.title}</Link>
                        </h2>
                        <Link to={to} className="mt-3 inline-flex text-base font-bold text-brand hover:underline">
                          Open course
                        </Link>
                      </article>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <StudentEmpty
                title={needle ? 'No bookmarks match' : 'No bookmarked courses'}
                message={needle ? 'Try a different search.' : 'Save courses from Explore to see them here.'}
                action={!needle ? <Link to="/learn/courses" className="btn-brand">Explore courses</Link> : null}
              />
            )
          ) : visible.length ? (
            <ul className="space-y-5">
              {visible.map((row) => {
                const id = String(row.courseId || row.id);
                return (
                  <li key={row.id}>
                    <HubCard
                      enrollment={row}
                      bookmarked={favoriteIds.has(id)}
                      onToggleBookmark={() => {
                        if (busyId === id) return;
                        toggleBookmark(row);
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <StudentEmpty
              title={needle || track !== 'all'
                ? 'No courses match'
                : tab.key === 'completed'
                  ? 'No completed courses yet'
                  : tab.key === 'all'
                    ? 'You have not enrolled yet'
                    : 'No courses in progress'}
              message={
                needle || track !== 'all'
                  ? 'Try a different filter or search.'
                  : 'Enroll in a published course and it will appear here with its progress.'
              }
              action={!rows.length ? <Link to="/learn/courses" className="btn-brand">Explore courses</Link> : null}
            />
          )}
        </div>

        <aside className="space-y-5">
          {active.length ? (
            <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-hairline">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-2xl font-extrabold text-charcoal">Offline Course Materials</h3>
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-brand">
                  {offlineCount} Available
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {active.slice(0, offlineCount).map((row, index) => (
                  <li key={`pack-${row.id}`}>
                    <OfflinePack enrollment={row} index={index} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {milestones.length ? (
            <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-hairline">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-2xl font-extrabold text-charcoal">Upcoming Milestones</h3>
                <Link to="/learn/progress" className="text-xs font-bold uppercase tracking-wide text-brand hover:underline">
                  View All
                </Link>
              </div>
              <ul className="mt-2">
                {milestones.map((item) => (
                  <li key={item.id}>
                    <MilestoneRow {...item} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl bg-brand-soft/80 p-5 ring-1 ring-brand/10">
            <div className="flex items-start gap-3.5">
              <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-brand shadow-soft [&_svg]:h-5 [&_svg]:w-5">
                <ShieldIcon />
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-brand">Academic Integrity Standards</h3>
                <p className="mt-1.5 text-lg leading-relaxed text-charcoal-muted">
                  All assignment submissions, code repositories, and assessments are subject to automated verification against the EduAdmin Honor Code standard.
                </p>
                <Link to="/learn/progress" className="mt-3 inline-flex items-center gap-1 text-lg font-bold text-brand hover:underline [&_svg]:h-4 [&_svg]:w-4">
                  Review Institutional Policy Guide
                  <ArrowRightIcon />
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function StudentLearningPage() {
  useDocumentTitle('My learning');
  const resource = useStudentData();
  return (
    <StudentData resource={resource} label="Loading your courses">
      {(data) => <LearningBody data={data} />}
    </StudentData>
  );
}
