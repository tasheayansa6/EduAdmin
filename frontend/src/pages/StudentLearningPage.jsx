import { Link, useSearchParams } from 'react-router-dom';
import { FlameIcon, PlayIcon } from '../components/icons.jsx';
import { currentEnrollments, useDocumentTitle, useStore, useStudentData } from '../student/StudentData.jsx';
import {
  CourseCover,
  Meter,
  StudentData,
  StudentEmpty,
  enrollmentLink,
} from '../student/components.jsx';

const TABS = [
  { key: 'active', label: 'In progress', test: (row) => row.status === 'active' },
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
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
            {enrollment.categoryName}
          </span>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-display text-lg font-bold leading-snug text-charcoal">
            <Link to={href} className="hover:text-brand">{enrollment.courseTitle}</Link>
          </h3>
          {enrollment.instructorName ? (
            <p className="mt-1 text-sm text-charcoal-muted">{enrollment.instructorName}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-charcoal-muted">Syllabus completion</span>
            <span className="text-brand">{percent}%</span>
          </div>
          <Meter value={percent} label={`${enrollment.courseTitle} progress`} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs text-charcoal-muted">
            {enrollment.progressStatus === 'completed' ? 'All lessons done' : percent > 0 ? 'Continue where you left off' : 'Ready to begin'}
          </p>
          <Link to={href} className={`btn inline-flex gap-1.5 py-2 text-sm ${percent >= 50 ? 'btn-brand' : 'border border-brand/30 bg-brand-soft text-brand hover:bg-brand-muted/40'}`}>
            <PlayIcon />
            Continue learning
          </Link>
        </div>
      </div>
    </article>
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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-muted">My learning hub</p>
          <h1 className="display-title mt-1 text-3xl font-bold sm:text-4xl">My learning</h1>
        </div>
        {active.length ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand [&_svg]:h-4 [&_svg]:w-4">
            <FlameIcon />
            {active.length} active course{active.length === 1 ? '' : 's'}
            {avg != null ? ` · ${avg}% avg` : ''}
          </div>
        ) : null}
      </header>

      {(active.length || completed.length) ? (
        <div className="hub-card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <div>
            <p className="text-sm font-semibold text-charcoal">Learning target</p>
            <p className="mt-1 text-sm text-charcoal-muted">
              {completed.length} completed · {active.length} in progress
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold text-brand">{avg == null ? '—' : `${avg}%`}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-muted">Average progress</p>
          </div>
        </div>
      ) : null}

      <div className="relative">
        <label htmlFor="my-learning-find" className="sr-only">Search enrolled courses</label>
        <input
          id="my-learning-find"
          type="search"
          className="s-field rounded-full"
          placeholder="Search enrolled courses, topics, or instructors"
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
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${selected ? 'border-brand text-brand' : 'border-transparent text-charcoal-muted hover:text-charcoal'}`}
              onClick={() => update('tab', item.key, 'active')}
            >
              {item.label}
              <span className="ml-1.5 tabular-nums text-charcoal-muted">{counts[item.key]}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {tab.key === 'favorites' ? (
          visible.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((row) => <li key={row.id}><HubCard enrollment={row} /></li>)}
          </ul>
        ) : (
          <StudentEmpty
            title={needle ? 'No courses match' : tab.key === 'completed' ? 'No completed courses yet' : 'No courses in progress'}
            message={needle ? 'Try a different course title or category.' : 'Enroll in a published course and it will appear here with its progress.'}
            action={!rows.length ? <Link to="/learn/courses" className="btn-brand">Explore courses</Link> : null}
          />
        )}
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
