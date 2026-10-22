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
  { key: 'all', label: 'All Enroll', test: () => true },
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
  return `DEPT. OF ${String(enrollment.categoryName).toUpperCase()}`;
}

function statusBadge(percent, completed) {
  if (completed || percent >= 100) return { label: 'Completed', tone: 'bg-brand-soft text-brand' };
  if (percent >= 55) return { label: 'In Progress', tone: 'bg-brand-soft text-brand' };
  if (percent >= 25) return { label: 'Quiz Due in 2d', tone: 'bg-wheat/25 text-wheat-ink' };
  if (percent > 0) return { label: 'In Progress', tone: 'bg-brand-soft text-brand' };
  return { label: 'Ready', tone: 'bg-sand text-charcoal-muted' };
}

function lessonsDone(percent) {
  const total = 18;
  const done = Math.round((Math.max(0, Math.min(100, percent)) / 100) * total);
  return { done, total };
}

function lastActiveLabel(percent) {
  if (percent >= 100) return 'Course complete';
  if (percent >= 60) return 'Last active: Yesterday, 8:15 PM';
  if (percent >= 25) return 'Last active: This week';
  if (percent > 0) return 'Last active: Recently';
  return 'Not started yet';
}

function nextLessonLabel(percent) {
  if (percent >= 100) return 'Review complete course';
  const lesson = Math.max(1, Math.min(18, Math.ceil((percent || 5) / 6) + 1));
  return `Lesson ${lesson}.${Math.max(1, Math.ceil((percent || 5) % 5) || 1)}`;
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

function HubCard({ enrollment, emphasize, bookmarked, onToggleBookmark }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  const code = courseCode(enrollment);
  const completed = enrollment.status === 'completed' || percent >= 100;
  const badge = statusBadge(percent, completed);
  const lessons = lessonsDone(percent);

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-40 w-full shrink-0 overflow-hidden bg-sand sm:h-auto sm:w-44 md:w-52">
          <CourseCover
            category={enrollment.categoryName}
            title={enrollment.courseTitle}
            className="!aspect-auto absolute inset-0 h-full w-full"
          />
          <span className="absolute left-2.5 top-2.5 rounded bg-charcoal/75 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {code}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
                {deptLabel(enrollment)}
              </p>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.tone}`}>
                {badge.label}
              </span>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold leading-snug text-charcoal md:text-xl">
                <Link to={href} className="hover:text-brand">{enrollment.courseTitle}</Link>
              </h3>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-charcoal-muted">
                <span className="inline-flex items-center gap-1 [&_svg]:h-3.5 [&_svg]:w-3.5">
                  <UserIcon />
                  {enrollment.instructorName || 'Instructor TBA'}
                </span>
                <span className="font-semibold">
                  {enrollment.credits != null ? `${enrollment.credits} Credits` : '3.0 Credits'}
                </span>
              </p>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-charcoal-muted">Syllabus Completion</span>
                <span className="font-bold text-brand">
                  {percent}% ({lessons.done}/{lessons.total} lessons)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-brand-soft">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-sand/60 px-4 py-3 sm:px-5">
            <p className="min-w-0 text-xs text-charcoal-muted">
              {lastActiveLabel(percent)}
              {!completed ? (
                <>
                  {' · '}
                  <span className="font-semibold text-charcoal">Next: {nextLessonLabel(percent)}</span>
                </>
              ) : null}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
                  bookmarked ? 'bg-brand-soft text-brand' : 'bg-white text-charcoal-muted hover:text-brand'
                }`}
                aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark course'}
                aria-pressed={bookmarked}
                onClick={onToggleBookmark}
              >
                <HeartIcon filled={bookmarked} />
              </button>
              <Link
                to={href}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold ${
                  emphasize
                    ? 'bg-brand text-white shadow-soft hover:bg-brand-hover'
                    : 'bg-brand text-white shadow-soft hover:bg-brand-hover'
                }`}
              >
                Continue Learning
                <span className="[&_svg]:h-3.5 [&_svg]:w-3.5"><ArrowRightIcon /></span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function OfflinePack({ enrollment }) {
  const href = enrollmentLink(enrollment);
  const code = courseCode(enrollment);
  return (
    <div className="flex items-center gap-3 rounded-xl bg-sand/70 p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-brand shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-charcoal">{code} Midterm Reading Pack</p>
        <p className="mt-0.5 text-xs text-charcoal-muted">PDF · {(1.2 + (enrollment.percent || 0) / 100).toFixed(1)} MB</p>
      </div>
      <Link
        to={href}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-brand hover:bg-brand hover:text-white"
        aria-label={`Download materials for ${enrollment.courseTitle}`}
      >
        <DownloadIcon />
      </Link>
    </div>
  );
}

function MilestoneRow({ title, course, dayLabel, timeLabel, urgent }) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-charcoal">{title}</p>
          <p className="mt-0.5 truncate text-xs text-charcoal-muted">{course}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${urgent ? 'bg-wheat/25 text-wheat-ink' : 'bg-sand text-charcoal-muted'}`}>
          {dayLabel}
        </span>
      </div>
      <p className="mt-1 text-xs text-charcoal-muted">{timeLabel}</p>
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
  const hoursDone = Math.round(((Number(avg) || 45) / 100) * hoursTarget * 10) / 10;
  const ringValue = avg ?? Math.round((hoursDone / hoursTarget) * 100);
  const streak = rows.length ? Math.max(active.length * 2 || 1, completed.length ? 2 : 1) : 0;

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
    title: index === 0 ? `${row.courseTitle} Lab` : `${row.courseTitle} Review`,
    course: row.courseTitle,
    dayLabel: index === 0 ? 'Due Tomorrow' : 'Friday',
    timeLabel: index === 0 ? '11:59 PM' : '5:00 PM',
    urgent: index === 0,
  }));

  return (
    <div className="space-y-5 md:space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            Academic session {year}–{year + 1}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[1.75rem] font-bold tracking-tight text-charcoal md:text-[2.15rem]">
              My Learning Hub
            </h1>
            {streak ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand [&_svg]:h-3.5 [&_svg]:w-3.5">
                <FlameIcon />
                {streak}-day streak
              </span>
            ) : null}
          </div>
          <p className="text-sm text-charcoal-muted">
            Spring {year + 1} · Year 3 Undergraduate · Department of Computer Science
          </p>
        </div>

        {(active.length || completed.length) ? (
          <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-hairline lg:w-80">
            <PaceRing value={ringValue} size="md" label="Done" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal-muted">Weekly target</p>
              <p className="mt-0.5 text-sm font-bold text-charcoal">
                {hoursDone} of {hoursTarget} hrs
              </p>
              <Link
                to="/learn/progress"
                className="mt-2 inline-flex rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-hover"
              >
                Schedule
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter courses" className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((item) => {
            const selected = item.key === tab.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={selected}
                className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  selected ? 'bg-brand text-white shadow-soft' : 'bg-white text-charcoal ring-1 ring-hairline hover:bg-mint-soft'
                }`}
                onClick={() => update('tab', item.key, 'active')}
              >
                {item.label}
                <span className={`ml-1.5 tabular-nums ${selected ? 'text-white/85' : 'text-charcoal-muted'}`}>
                  ({counts[item.key]})
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:w-56">
            <label htmlFor="my-learning-find" className="sr-only">Search enrolled courses</label>
            <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
              <SearchIcon />
            </span>
            <input
              id="my-learning-find"
              type="search"
              className="s-field rounded-full border-transparent bg-white pl-10 shadow-soft"
              placeholder="Search my courses"
              value={filter}
              onChange={(event) => update('find', event.target.value)}
            />
          </div>

          {tab.key !== 'favorites' ? (
            <>
              <label className="relative">
                <span className="sr-only">Track</span>
                <select
                  className="s-field appearance-none rounded-full border-hairline bg-white py-2 pl-3 pr-9 text-sm font-semibold"
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                >
                  <option value="all">All Tracks</option>
                  {tracks.filter((item) => item !== 'all').map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
                  <ChevronDownIcon />
                </span>
              </label>
              <label className="relative">
                <span className="sr-only">Sort</span>
                <select
                  className="s-field appearance-none rounded-full border-hairline bg-white py-2 pl-3 pr-9 text-sm font-semibold"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="recent">Recently Accessed</option>
                  <option value="title">Title A–Z</option>
                  <option value="progress">Progress</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
                  <ChevronDownIcon />
                </span>
              </label>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div aria-live="polite" className="min-w-0">
          {tab.key === 'favorites' ? (
            visible.length ? (
              <ul className="space-y-4">
                {visible.map((item) => {
                  const to = item.local || !item.slug
                    ? `/learn/my-courses/${item.courseId ?? item.id}`
                    : `/learn/courses/${item.slug}`;
                  return (
                    <li key={item.key || item.slug || item.courseId}>
                      <article className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-hairline">
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
                          {item.category || 'Bookmarked'}
                        </p>
                        <h3 className="mt-1 font-display text-lg font-bold">
                          <Link to={to} className="hover:text-brand">{item.title}</Link>
                        </h3>
                        <Link to={to} className="mt-3 inline-flex text-sm font-bold text-brand hover:underline">
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
            <ul className="space-y-4">
              {visible.map((row, index) => {
                const id = String(row.courseId || row.id);
                return (
                  <li key={row.id}>
                    <HubCard
                      enrollment={row}
                      emphasize={index === 0}
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

        <aside className="space-y-4">
          {active.length ? (
            <section className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-hairline">
              <h2 className="font-display text-base font-bold text-charcoal">Offline Course Materials</h2>
              <ul className="mt-3 space-y-2">
                {active.slice(0, 3).map((row) => (
                  <li key={`pack-${row.id}`}>
                    <OfflinePack enrollment={row} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {milestones.length ? (
            <section className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-hairline">
              <h2 className="font-display text-base font-bold text-charcoal">Upcoming Milestones</h2>
              <ul className="mt-3 space-y-2">
                {milestones.map((item) => (
                  <li key={item.id}>
                    <MilestoneRow {...item} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl bg-brand-soft/80 p-4 ring-1 ring-brand/10">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-brand shadow-soft [&_svg]:h-4 [&_svg]:w-4">
                <ShieldIcon />
              </span>
              <div>
                <p className="text-sm font-bold text-brand">Academic Integrity Standards</p>
                <p className="mt-1 text-sm leading-relaxed text-charcoal-muted">
                  Complete your own work. All submissions are subject to automated verification.
                </p>
                <Link to="/learn/progress" className="mt-2 inline-flex text-xs font-bold text-brand hover:underline">
                  Institutional Policy Guide
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
