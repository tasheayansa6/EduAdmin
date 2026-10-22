import { Link, useSearchParams } from 'react-router-dom';
import { FlameIcon, PlayIcon, SearchIcon } from '../components/icons.jsx';
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

function HubCard({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  return (
    <article className="hub-card">
      <div className="relative">
        <CourseCover category={enrollment.categoryName} title={enrollment.courseTitle} />
        <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          {enrollment.status === 'completed' ? 'Completed' : 'In progress'}
        </span>
        {enrollment.categoryName ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand shadow-soft">
            {enrollment.categoryName}
          </span>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        {enrollment.categoryName ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
            {enrollment.categoryName}
          </p>
        ) : null}
        <div>
          <h3 className="font-display text-lg font-bold leading-snug text-charcoal">
            <Link to={href} className="hover:text-brand">{enrollment.courseTitle}</Link>
          </h3>
          {enrollment.instructorName ? (
            <p className="mt-1 text-sm text-charcoal-muted">{enrollment.instructorName}</p>
          ) : null}
        </div>
        <div className="rounded-2xl bg-brand-soft/70 p-3">
          <div className="mb-1.5 flex justify-between text-xs font-semibold">
            <span className="text-charcoal-muted">Syllabus completion</span>
            <span className="text-brand">{percent}%</span>
          </div>
          <Meter value={percent} label={`${enrollment.courseTitle} progress`} />
          <p className="mt-2 text-xs text-charcoal-muted">
            {enrollment.progressStatus === 'completed'
              ? 'All lessons done'
              : percent > 0
                ? 'Continue where you left off'
                : 'Ready to begin'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs font-semibold text-charcoal-muted">
            {percent >= 100 ? 'Course complete' : `Next: continue learning`}
          </p>
          <Link
            to={href}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-sm font-bold text-white hover:bg-brand-hover"
          >
            <PlayIcon />
            Continue learning
          </Link>
        </div>
      </div>
    </article>
  );
}

function Ring({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg viewBox="0 0 72 72" className="h-16 w-16 shrink-0" aria-hidden="true">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#e8efe9" strokeWidth="7" />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#15432a"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
      />
      <text x="36" y="40" textAnchor="middle" className="fill-brand text-[13px] font-bold">
        {pct}%
      </text>
    </svg>
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

  let visible;
  if (tab.key === 'favorites') {
    visible = favorites
      .filter((item) => !needle || `${item.title} ${item.category || ''}`.toLowerCase().includes(needle))
      .sort((a, b) => String(a.title).localeCompare(String(b.title)));
  } else {
    visible = rows
      .filter(tab.test)
      .filter((row) => !needle || `${row.courseTitle} ${row.categoryName || ''}`.toLowerCase().includes(needle))
      .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));
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
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            Academic session {year}
          </p>
          {active.length ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand [&_svg]:h-3.5 [&_svg]:w-3.5">
              <FlameIcon />
              {active.length} day streak
            </span>
          ) : null}
        </div>

        {(active.length || completed.length) ? (
          <div className="hub-card flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-charcoal">Weekly target</p>
              <p className="mt-1 text-sm text-charcoal-muted">
                {completed.length} completed · {active.length} in progress
                {avg != null ? ` · ${avg}% avg` : ''}
              </p>
            </div>
            <Ring value={avg ?? 0} />
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
          className="s-field rounded-full pl-10"
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
                    <article className="hub-card p-4">
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
            {visible.map((row) => (
              <li key={row.id}>
                <HubCard enrollment={row} />
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

      <section className="rounded-2xl border border-brand/15 bg-brand-soft/60 p-4">
        <p className="text-sm font-bold text-brand">Academic integrity</p>
        <p className="mt-1 text-sm text-charcoal-muted">
          Complete your own work and follow your institution’s honor code while learning.
        </p>
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
