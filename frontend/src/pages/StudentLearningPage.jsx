import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  HeartIcon,
  SearchIcon,
  UserIcon,
} from '../components/icons.jsx';
import { MiniWeekChart, PaceRing } from '../student/charts.jsx';
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

function statusBadge(percent, completed) {
  if (completed || percent >= 100) return { label: 'Completed', tone: 'bg-brand-soft text-brand' };
  if (percent > 0) return { label: 'In Progress', tone: 'bg-brand-soft text-brand' };
  return { label: 'Not started', tone: 'bg-sand text-charcoal-muted' };
}

function formatRelative(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const hours = Math.round((Date.now() - then) / 3600000);
  if (hours < 1) return 'Active just now';
  if (hours < 24) return `Last active ${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Last active yesterday';
  if (days < 14) return `Last active ${days} days ago`;
  return `Last active ${new Date(iso).toLocaleDateString()}`;
}

function continueLearningSidebar(active) {
  return active
    .filter((row) => (row.percent ?? 0) < 100)
    .slice(0, 3);
}

function HubCard({ enrollment, bookmarked, onToggleBookmark }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  const completed = enrollment.status === 'completed' || percent >= 100;
  const badge = statusBadge(percent, completed);
  const lessonsDone = enrollment.lessonsCompleted ?? 0;
  const lessonsTotal = enrollment.lessonsTotal;
  const activity = formatRelative(enrollment.lastActivityAt);

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-sand sm:h-auto sm:min-h-[14rem] sm:w-52 md:w-60 lg:w-64">
          <CourseCover
            category={enrollment.categoryName}
            title={enrollment.courseTitle}
            className="!aspect-auto absolute inset-0 h-full w-full"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-3.5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand">
                {enrollment.categoryName || 'Program'}
              </p>
              <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide ${badge.tone}`}>
                {badge.label}
              </span>
            </div>

            <div>
              <h2 className="font-display text-3xl font-extrabold leading-snug tracking-tight text-charcoal md:text-4xl">
                <Link to={href} className="hover:text-brand">{enrollment.courseTitle}</Link>
              </h2>
              <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-lg text-charcoal-muted">
                <span className="inline-flex items-center gap-1.5 [&_svg]:h-5 [&_svg]:w-5">
                  <UserIcon />
                  {enrollment.instructorName || 'Instructor TBA'}
                </span>
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-lg font-bold">
                <span className="text-charcoal">Progress</span>
                <span className="font-extrabold text-brand">
                  {percent}%
                  {lessonsTotal ? (
                    <span className="font-semibold text-charcoal-muted">
                      {' '}({lessonsDone}/{lessonsTotal} lessons)
                    </span>
                  ) : null}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-brand-soft">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-hairline bg-sand/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0 text-base leading-relaxed text-charcoal-muted">
              <p>
                {completed
                  ? 'Program complete — review anytime'
                  : activity || (percent > 0 ? 'In progress' : 'Ready when you are')}
              </p>
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
                {completed ? 'Review' : percent > 0 ? 'Continue' : 'Start'}
                <span className="[&_svg]:h-4 [&_svg]:w-4"><ArrowRightIcon /></span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
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
  const weekly = data.summary?.weeklyActivity;
  const ringValue = avg ?? 0;
  const focusCategory = data.summary?.focusCategory
    || active.find((row) => row.categoryName)?.categoryName
    || rows.find((row) => row.categoryName)?.categoryName
    || null;
  const focusLabel = focusCategory || null;

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
    } else if (sort === 'resume') {
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

  return (
    <div className="space-y-7 md:space-y-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-charcoal md:text-6xl lg:text-[4rem] lg:leading-[1.05]">
              My Learning
            </h1>
            {weekly?.thisWeek ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-bold uppercase tracking-wide text-brand">
                {weekly.thisWeek} lesson{weekly.thisWeek === 1 ? '' : 's'} this week
              </span>
            ) : null}
          </div>
          {focusLabel ? (
            <p className="text-xl font-medium text-charcoal-muted md:text-2xl">{focusLabel}</p>
          ) : null}
        </div>

        {(active.length || completed.length) ? (
          <div className="flex w-full max-w-md items-center gap-4 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-hairline lg:w-[24rem]">
            <PaceRing value={ringValue} size="md" label="Avg" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-charcoal-muted">Your progress</p>
              <p className="mt-1 font-display text-3xl font-extrabold leading-snug text-charcoal">
                {avg == null ? '—' : `${avg}%`}
              </p>
              <p className="mt-0.5 text-base text-charcoal-muted">
                {active.length} active · {completed.length} completed
              </p>
              <Link
                to="/learn/progress"
                className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-lg bg-brand px-4 text-base font-bold text-white hover:bg-brand-hover"
              >
                View progress
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
              placeholder="Search your programs..."
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
                  <option value="resume">Needs attention</option>
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
          {(active.length || completed.length) ? (
            <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-hairline">
              <h3 className="font-display text-2xl font-extrabold text-charcoal">This week</h3>
              <p className="mt-1 text-sm text-charcoal-muted">Lessons you completed (real activity)</p>
              <div className="mt-4">
                <MiniWeekChart weekly={weekly} height={110} />
              </div>
              <Link
                to="/learn/progress"
                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline [&_svg]:h-3.5 [&_svg]:w-3.5"
              >
                Full progress
                <ArrowRightIcon />
              </Link>
            </section>
          ) : null}

          {continueLearningSidebar(active).length ? (
            <section className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-hairline">
              <h3 className="font-display text-2xl font-extrabold text-charcoal">Continue</h3>
              <ul className="mt-3 divide-y divide-hairline">
                {continueLearningSidebar(active).map((row) => (
                  <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="truncate text-sm font-semibold text-charcoal">{row.courseTitle}</p>
                    <p className="mt-0.5 text-xs text-charcoal-muted">{row.percent ?? 0}% complete</p>
                    <Link to={enrollmentLink(row)} className="mt-1 inline-flex text-xs font-bold text-brand hover:underline">
                      {(row.percent ?? 0) > 0 ? 'Resume →' : 'Start →'}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
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
