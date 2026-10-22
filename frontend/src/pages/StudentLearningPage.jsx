import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  FlameIcon,
  HeartIcon,
  PlayIcon,
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

function nextHint(percent) {
  if (percent >= 100) return 'Course complete';
  if (percent >= 55) return 'Next: continue lesson';
  if (percent >= 25) return 'Quiz due in 2d';
  if (percent > 0) return 'Lab 02 ready';
  return 'Ready to begin';
}

function lastActivity(percent) {
  if (percent >= 100) return 'All lessons complete';
  if (percent >= 60) return 'Yesterday · keep going in the current module';
  if (percent >= 25) return 'This week · resume your next lesson';
  if (percent > 0) return 'Recently started · open the next lesson';
  return 'Not started · open the first lesson';
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
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

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="relative aspect-[16/9] overflow-hidden sm:aspect-[2.2/1]">
        <CourseCover
          category={enrollment.categoryName}
          title={enrollment.courseTitle}
          className="!aspect-auto absolute inset-0 h-full w-full"
        />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand shadow-soft">
          {completed ? 'Completed' : 'In progress'}
        </span>
        <span className="absolute right-2.5 top-2.5 rounded-full bg-charcoal/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          {code}
        </span>
      </div>

      <div className="space-y-3 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
              {deptLabel(enrollment)}
            </p>
            <h3 className="mt-1 font-display text-base font-bold leading-snug text-charcoal sm:text-lg">
              <Link to={href} className="hover:text-brand">{enrollment.courseTitle}</Link>
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-charcoal-muted">
              <span className="inline-flex items-center gap-1 [&_svg]:h-3.5 [&_svg]:w-3.5">
                <UserIcon />
                {enrollment.instructorName || 'Instructor TBA'}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold">
                {enrollment.credits != null ? `${enrollment.credits} Credits` : '3.0 Credits'}
              </span>
            </p>
          </div>
          <button
            type="button"
            className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
              bookmarked ? 'bg-brand-soft text-brand' : 'bg-sand text-charcoal-muted hover:text-brand'
            }`}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark course'}
            aria-pressed={bookmarked}
            onClick={onToggleBookmark}
          >
            <HeartIcon filled={bookmarked} />
          </button>
        </div>

        <div className="rounded-xl bg-[#e8f1ea] p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
            <span className="text-charcoal-muted">Syllabus completion</span>
            <span className="font-bold text-brand">{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/80">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-charcoal-muted">{lastActivity(percent)}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-charcoal-muted">{nextHint(percent)}</p>
          <Link
            to={href}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold ${
              emphasize
                ? 'bg-brand text-white shadow-soft hover:bg-brand-hover'
                : 'bg-brand-soft text-brand hover:bg-brand hover:text-white'
            }`}
          >
            <PlayIcon />
            Continue learning
            <span className="[&_svg]:h-3.5 [&_svg]:w-3.5"><ArrowRightIcon /></span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function OfflinePack({ enrollment }) {
  const href = enrollmentLink(enrollment);
  const code = courseCode(enrollment);
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-hairline">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-charcoal">{code} Midterm Reading Pack</p>
        <p className="mt-0.5 text-xs text-charcoal-muted">PDFs & lab datasets · Synced for offline use</p>
      </div>
      <Link
        to={href}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand hover:bg-brand hover:text-white"
        aria-label={`Open materials for ${enrollment.courseTitle}`}
      >
        <DownloadIcon />
      </Link>
    </div>
  );
}

function LearningBody({ data }) {
  const [params, setParams] = useSearchParams();
  const { favorites, setFavorite } = useStore();
  const [busyId, setBusyId] = useState(null);
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
      .filter((row) => !needle || `${row.courseTitle} ${row.categoryName || ''}`.toLowerCase().includes(needle))
      .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0) || new Date(b.enrolledAt) - new Date(a.enrolledAt));
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
  };

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
          Academic session {year}-{year + 1}
        </p>

        <div className="flex flex-wrap items-end justify-between gap-2">
          <h1 className="font-display text-[1.75rem] font-bold tracking-tight text-charcoal sm:text-[2.35rem]">
            My Learning Hub
          </h1>
          {streak ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand [&_svg]:h-3.5 [&_svg]:w-3.5">
              <FlameIcon />
              {streak} day streak
            </span>
          ) : null}
        </div>

        {(active.length || completed.length) ? (
          <div className="flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-soft ring-1 ring-hairline sm:gap-3 sm:p-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <TargetIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-charcoal">
                Weekly target: {hoursDone} of {hoursTarget} hrs
              </p>
              <p className="mt-0.5 text-sm text-charcoal-muted">
                {ringValue}% completed · Keep the momentum!
              </p>
            </div>
            <PaceRing value={ringValue} size="md" label="Done" />
          </div>
        ) : null}
      </header>

      <div className="relative">
        <label htmlFor="my-learning-find" className="sr-only">Search enrolled courses</label>
        <span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
          <SearchIcon />
        </span>
        <input
          id="my-learning-find"
          type="search"
          className="s-field rounded-full border-transparent bg-white pl-10 shadow-soft"
          placeholder="Search enrolled courses, topics, or faculty"
          value={filter}
          onChange={(event) => update('find', event.target.value)}
        />
      </div>

      <div role="group" aria-label="Filter courses" className="-mx-3 flex gap-1 overflow-x-auto border-b border-hairline px-3 sm:-mx-0 sm:px-0">
        {TABS.map((item) => {
          const selected = item.key === tab.key;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={selected}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                selected ? 'border-brand text-brand' : 'border-transparent text-charcoal-muted hover:text-charcoal'
              }`}
              onClick={() => update('tab', item.key, 'active')}
            >
              {item.label}
              <span className={`ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${
                selected ? 'bg-brand-soft text-brand' : 'text-charcoal-muted'
              }`}>
                {counts[item.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {tab.key === 'favorites' ? (
          visible.length ? (
            <ul className="space-y-4">
              {visible.map((item) => {
                const to = item.local || !item.slug
                  ? `/learn/my-courses/${item.courseId ?? item.id}`
                  : `/learn/courses/${item.slug}`;
                return (
                  <li key={item.key || item.slug || item.courseId}>
                    <article className="rounded-[1.35rem] bg-white p-4 shadow-soft ring-1 ring-hairline">
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
              title={needle ? 'No favorites match' : 'No bookmarked courses'}
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
            title={needle ? 'No courses match' : tab.key === 'completed' ? 'No completed courses yet' : 'No courses in progress'}
            message={needle ? 'Try a different course title or category.' : 'Enroll in a published course and it will appear here with its progress.'}
            action={!rows.length ? <Link to="/learn/courses" className="btn-brand">Explore courses</Link> : null}
          />
        )}
      </div>

      {active.length ? (
        <section aria-labelledby="offline-heading" className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 id="offline-heading" className="font-display text-lg font-bold text-charcoal">
              Offline course materials
            </h2>
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
              {Math.min(active.length, 3)} available
            </span>
          </div>
          <ul className="space-y-2.5">
            {active.slice(0, 3).map((row) => (
              <li key={`pack-${row.id}`}>
                <OfflinePack enrollment={row} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex items-start gap-3 rounded-2xl bg-brand-soft/80 p-4 ring-1 ring-brand/10">
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-brand shadow-soft [&_svg]:h-4 [&_svg]:w-4">
          <ShieldIcon />
        </span>
        <div>
          <p className="text-sm font-bold text-brand">Academic integrity & institutional honor code</p>
          <p className="mt-1 text-sm leading-relaxed text-charcoal-muted">
            Complete your own work. All submissions are subject to automated verification.
          </p>
        </div>
      </section>
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
