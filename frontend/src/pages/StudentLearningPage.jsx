import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon, FlameIcon, PlayIcon, SearchIcon, ShieldIcon } from '../components/icons.jsx';
import { PaceRing } from '../student/charts.jsx';
import { currentEnrollments, useDocumentTitle, useStore, useStudentData } from '../student/StudentData.jsx';
import {
  CourseCover,
  Meter,
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
  const id = String(enrollment.courseId || enrollment.id || 100).slice(-3);
  return `${letters}-${id}`;
}

function nextHint(enrollment, percent) {
  if (enrollment.status === 'completed' || percent >= 100) return 'Course complete';
  if (percent >= 60) return 'Next: continue lesson';
  if (percent >= 30) return 'Quiz due soon';
  if (percent > 0) return 'Lab ready';
  return 'Ready to begin';
}

function activityHint(enrollment, percent) {
  if (enrollment.progressStatus === 'completed' || percent >= 100) return 'All lessons done';
  if (percent > 0) return 'Recently active · keep the momentum';
  return 'Not started yet · open the first lesson';
}

function HubCard({ enrollment, emphasize }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  const code = courseCode(enrollment);
  return (
    <article className="overflow-hidden rounded-[1.5rem] bg-white shadow-soft ring-1 ring-hairline">
      <div className="relative">
        <CourseCover category={enrollment.categoryName} title={enrollment.courseTitle} />
        <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          {enrollment.status === 'completed' ? 'Completed' : 'In progress'}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand shadow-soft">
          {code}
        </span>
      </div>
      <div className="space-y-3 p-4">
        {enrollment.categoryName ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
            {enrollment.categoryName}
          </p>
        ) : (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">Enrolled course</p>
        )}
        <div>
          <h3 className="font-display text-lg font-bold leading-snug text-charcoal">
            <Link to={href} className="hover:text-brand">{enrollment.courseTitle}</Link>
          </h3>
          <p className="mt-1 text-sm text-charcoal-muted">
            {[enrollment.instructorName, enrollment.credits != null ? `${enrollment.credits} Credits` : null]
              .filter(Boolean)
              .join(' · ') || 'Continue your syllabus'}
          </p>
        </div>
        <div className="rounded-2xl bg-brand-soft/80 p-3">
          <div className="mb-1.5 flex justify-between text-xs font-semibold">
            <span className="text-charcoal-muted">Syllabus completion</span>
            <span className="text-brand">{percent}%</span>
          </div>
          <Meter value={percent} label={`${enrollment.courseTitle} progress`} />
          <p className="mt-2 text-xs text-charcoal-muted">{activityHint(enrollment, percent)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <p className="text-xs font-semibold text-charcoal-muted">{nextHint(enrollment, percent)}</p>
          <Link
            to={href}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-bold ${
              emphasize
                ? 'bg-brand text-white hover:bg-brand-hover'
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
  if (!enrollment) return null;
  const href = enrollmentLink(enrollment);
  const code = courseCode(enrollment);
  return (
    <Link
      to={href}
      className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-soft ring-1 ring-hairline transition hover:ring-brand/30"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-charcoal">{code} reading pack</span>
        <span className="mt-0.5 block text-xs text-charcoal-muted">
          Course materials · Synced for offline review
        </span>
      </span>
      <span className="text-sm font-bold text-brand">Open</span>
    </Link>
  );
}

function LearningBody({ data }) {
  const [params, setParams] = useSearchParams();
  const { favorites } = useStore();
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
  const hoursDone = Math.round(((Number(avg) || 35) / 100) * hoursTarget * 10) / 10;
  const ringValue = avg ?? Math.round((hoursDone / hoursTarget) * 100);
  const streak = Math.max(active.length, completed.length ? 1 : 0);

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

  const counts = {
    active: active.length,
    completed: completed.length,
    favorites: favorites.length,
  };

  return (
    <div className="space-y-5">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            Academic session {year}-{year + 1}
          </p>
          {streak ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand [&_svg]:h-3.5 [&_svg]:w-3.5">
              <FlameIcon />
              {streak} day streak
            </span>
          ) : null}
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">
          My Learning Hub
        </h1>

        {(active.length || completed.length) ? (
          <div className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-white p-4 shadow-soft ring-1 ring-hairline">
            <div className="min-w-0">
              <p className="text-sm font-bold text-charcoal">
                Weekly target: {hoursDone} of {hoursTarget} hrs
              </p>
              <p className="mt-1 text-sm text-charcoal-muted">
                {ringValue}% completed · Keep the momentum!
              </p>
            </div>
            <PaceRing value={ringValue} size="lg" label="Done" />
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

      <div role="group" aria-label="Filter courses" className="-mx-4 flex gap-1 overflow-x-auto border-b border-hairline px-4 sm:mx-0 sm:px-0">
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
              <span className="ml-1.5 tabular-nums text-charcoal-muted">({counts[item.key]})</span>
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
                    <article className="rounded-[1.5rem] bg-white p-4 shadow-soft ring-1 ring-hairline">
                      <p className="eyebrow">{item.category || 'Favorite'}</p>
                      <h3 className="mt-1 font-display text-lg font-bold">
                        <Link to={to} className="hover:text-brand">{item.title}</Link>
                      </h3>
                      <Link to={to} className="btn-quiet mt-3 px-0">Open course</Link>
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
            {visible.map((row, index) => (
              <li key={row.id}>
                <HubCard enrollment={row} emphasize={index === 0 || (row.percent ?? 0) >= 50} />
              </li>
            ))}
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
          <ul className="space-y-2">
            {active.slice(0, 3).map((row) => (
              <li key={`pack-${row.id}`}>
                <OfflinePack enrollment={row} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex items-start gap-3 rounded-2xl bg-brand-soft/70 p-4 ring-1 ring-brand/10">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-brand [&_svg]:h-4 [&_svg]:w-4">
          <ShieldIcon />
        </span>
        <div>
          <p className="text-sm font-bold text-brand">Academic integrity & institutional honor code</p>
          <p className="mt-1 text-sm text-charcoal-muted">
            Complete your own work. Submissions may be checked for academic integrity.
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
