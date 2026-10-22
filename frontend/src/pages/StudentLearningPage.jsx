import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ChevronDownIcon,
  ClockIcon,
  FlameIcon,
  SearchIcon,
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
  { key: 'all', label: 'All courses' },
  { key: 'active', label: 'In progress' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'completed', label: 'Completed' },
  { key: 'archived', label: 'Archived' },
];

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

function weekRangeLabel() {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function LearningCourseCard({ enrollment, bookmarked, onToggleBookmark, menuOpen, onMenuToggle }) {
  const href = enrollmentLink(enrollment);
  const percent = enrollment.percent ?? 0;

  return (
    <article className="group relative">
      <div className="relative aspect-[16/9] overflow-hidden rounded bg-[#1c1d1f]">
        <Link to={href} className="absolute inset-0 block" tabIndex={-1} aria-hidden="true">
          <CourseCover
            category={enrollment.categoryName}
            title={enrollment.courseTitle}
            className="!aspect-auto h-full w-full"
          />
        </Link>
        <div className="absolute right-1.5 top-1.5">
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white opacity-90 backdrop-blur-sm hover:bg-black/75"
            aria-label={`More options for ${enrollment.courseTitle}`}
            aria-expanded={menuOpen}
            onClick={onMenuToggle}
          >
            <MoreIcon />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded border border-hairline bg-white py-1 shadow-lift">
              <Link
                to={href}
                className="block px-3 py-2 text-sm font-semibold text-charcoal hover:bg-sand"
              >
                Continue learning
              </Link>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm font-semibold text-charcoal hover:bg-sand"
                onClick={onToggleBookmark}
              >
                {bookmarked ? 'Remove from wishlist' : 'Add to wishlist'}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 space-y-1">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-charcoal">
          <Link to={href} className="hover:text-brand">
            {enrollment.courseTitle}
          </Link>
        </h3>
        <p className="truncate text-xs text-charcoal-muted">
          {enrollment.instructorName || 'Instructor TBA'}
        </p>
        {percent > 0 ? (
          <div className="pt-1">
            <div className="h-1 overflow-hidden rounded-full bg-sand">
              <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 text-[11px] font-semibold text-charcoal-muted">{percent}% complete</p>
          </div>
        ) : (
          <p className="pt-1 text-[11px] font-semibold text-charcoal-muted">Start course</p>
        )}
      </div>
    </article>
  );
}

function FavoriteCard({ item }) {
  const to = item.local || !item.slug
    ? `/learn/my-courses/${item.courseId ?? item.id}`
    : `/learn/courses/${item.slug}`;

  return (
    <article className="group">
      <Link to={to} className="block overflow-hidden rounded bg-[#1c1d1f]">
        <CourseCover
          category={item.category}
          title={item.title}
          className="!aspect-auto aspect-[16/9] h-full w-full"
        />
      </Link>
      <div className="mt-2.5 space-y-1">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-charcoal">
          <Link to={to} className="hover:text-brand">{item.title}</Link>
        </h3>
        <p className="truncate text-xs text-charcoal-muted">{item.category || 'Wishlist'}</p>
      </div>
    </article>
  );
}

function LearningBody({ data }) {
  const [params, setParams] = useSearchParams();
  const { favorites, setFavorite } = useStore();
  const [busyId, setBusyId] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [category, setCategory] = useState('all');
  const [progress, setProgress] = useState('all');
  const [instructor, setInstructor] = useState('all');
  const [sort, setSort] = useState('recent');

  const rows = currentEnrollments(data);
  const active = rows.filter((row) => row.status === 'active');
  const completed = rows.filter((row) => row.status === 'completed');
  const avg = data.summary?.averageProgress;
  const tabKey = params.get('tab') || 'all';
  const tab = TABS.find((item) => item.key === tabKey) ?? TABS[0];
  const filter = params.get('find') || '';
  const needle = filter.trim().toLowerCase();

  const minutesGoal = 30;
  const minutesDone = Math.min(minutesGoal, Math.round(((Number(avg) || 20) / 100) * minutesGoal));
  const visitsGoal = 1;
  const visitsDone = rows.length ? Math.min(3, Math.max(1, active.length)) : 0;
  const ringValue = Math.round(((minutesDone / minutesGoal) * 0.5 + (Math.min(visitsDone, visitsGoal) / visitsGoal) * 0.5) * 100);
  const streakWeeks = rows.length ? Math.max(1, Math.min(4, completed.length + (active.length ? 1 : 0))) : 0;

  const favoriteIds = new Set(
    favorites.map((item) => String(item.courseId ?? item.id ?? item.slug ?? '')),
  );

  const categories = useMemo(() => {
    const set = new Set(rows.map((row) => row.categoryName).filter(Boolean));
    return ['all', ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const instructors = useMemo(() => {
    const set = new Set(rows.map((row) => row.instructorName).filter(Boolean));
    return ['all', ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  let visible;
  if (tab.key === 'wishlist') {
    visible = favorites
      .filter((item) => !needle || `${item.title} ${item.category || ''}`.toLowerCase().includes(needle))
      .sort((a, b) => String(a.title).localeCompare(String(b.title)));
  } else if (tab.key === 'archived') {
    visible = [];
  } else {
    visible = rows
      .filter((row) => {
        if (tab.key === 'active') return row.status === 'active';
        if (tab.key === 'completed') return row.status === 'completed';
        return true;
      })
      .filter((row) => !needle || `${row.courseTitle} ${row.categoryName || ''} ${row.instructorName || ''}`.toLowerCase().includes(needle))
      .filter((row) => category === 'all' || row.categoryName === category)
      .filter((row) => instructor === 'all' || row.instructorName === instructor)
      .filter((row) => {
        const pct = row.percent ?? 0;
        if (progress === 'not-started') return pct === 0;
        if (progress === 'in-progress') return pct > 0 && pct < 100;
        if (progress === 'completed') return pct >= 100 || row.status === 'completed';
        return true;
      });

    if (sort === 'title') {
      visible = [...visible].sort((a, b) => String(a.courseTitle).localeCompare(String(b.courseTitle)));
    } else if (sort === 'progress') {
      visible = [...visible].sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
    } else {
      visible = [...visible].sort((a, b) => new Date(b.enrolledAt || 0) - new Date(a.enrolledAt || 0));
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
    setMenuId(null);
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

  const showFilters = tab.key !== 'wishlist' && tab.key !== 'archived';

  return (
    <div>
      <header className="bg-[#1c1d1f] text-white">
        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">My learning</h1>
          <nav aria-label="Learning sections" className="-mb-px mt-6 flex gap-5 overflow-x-auto sm:gap-7">
            {TABS.map((item) => {
              const selected = item.key === tab.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  className={`whitespace-nowrap border-b-2 pb-3 text-sm font-bold transition ${
                    selected
                      ? 'border-white text-white'
                      : 'border-transparent text-white/65 hover:text-white'
                  }`}
                  onClick={() => update('tab', item.key, 'all')}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {(active.length || completed.length) ? (
          <section className="rounded border border-hairline bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 lg:max-w-sm">
                <h2 className="text-lg font-bold text-charcoal">Weekly streak</h2>
                <p className="mt-1 text-sm text-charcoal-muted">
                  You’re well on your way to reaching your learning goals.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-brand [&_svg]:h-5 [&_svg]:w-5">
                  <FlameIcon />
                </span>
                <div>
                  <p className="text-base font-bold text-charcoal">
                    {streakWeeks} week{streakWeeks === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs font-semibold text-charcoal-muted">Current streak</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <PaceRing value={ringValue} size="md" label="Goal" />
                <div className="space-y-1.5 text-sm">
                  <p className="text-xs font-semibold text-charcoal-muted">{weekRangeLabel()}</p>
                  <p className="flex items-center gap-2 font-semibold text-charcoal">
                    <span className="h-2 w-2 rounded-full bg-wheat" aria-hidden="true" />
                    {minutesDone}/{minutesGoal} course min
                  </p>
                  <p className="flex items-center gap-2 font-semibold text-charcoal">
                    <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
                    {visitsDone}/{visitsGoal} visit{visitsGoal === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {scheduleOpen ? (
          <section className="flex flex-col gap-3 rounded border border-hairline bg-white p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand [&_svg]:h-5 [&_svg]:w-5">
              <ClockIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-charcoal">
                <span className="font-bold">Schedule learning time</span>
                {' — '}
                Learning a little each day adds up. Set time aside to learn and get reminders to help you stay on track.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                to="/learn/progress"
                className="rounded border-2 border-brand px-3.5 py-2 text-sm font-bold text-brand hover:bg-brand-soft"
              >
                Get started
              </Link>
              <button
                type="button"
                className="text-sm font-bold text-brand hover:underline"
                onClick={() => setScheduleOpen(false)}
              >
                Dismiss
              </button>
            </div>
          </section>
        ) : null}

        {showFilters ? (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <label className="relative">
                <span className="sr-only">Categories</span>
                <select
                  className="s-field appearance-none rounded border-hairline bg-white py-2 pl-3 pr-9 text-sm font-semibold"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="all">Categories</option>
                  {categories.filter((c) => c !== 'all').map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
                  <ChevronDownIcon />
                </span>
              </label>

              <label className="relative">
                <span className="sr-only">Progress</span>
                <select
                  className="s-field appearance-none rounded border-hairline bg-white py-2 pl-3 pr-9 text-sm font-semibold"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                >
                  <option value="all">Progress</option>
                  <option value="not-started">Not started</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
                  <ChevronDownIcon />
                </span>
              </label>

              <label className="relative">
                <span className="sr-only">Instructor</span>
                <select
                  className="s-field appearance-none rounded border-hairline bg-white py-2 pl-3 pr-9 text-sm font-semibold"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                >
                  <option value="all">Instructor</option>
                  {instructors.filter((c) => c !== 'all').map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
                  <ChevronDownIcon />
                </span>
              </label>
            </div>

            <form
              role="search"
              className="flex w-full max-w-md overflow-hidden rounded border border-hairline bg-white"
              onSubmit={(e) => e.preventDefault()}
            >
              <label htmlFor="my-learning-find" className="sr-only">Search my courses</label>
              <input
                id="my-learning-find"
                type="search"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none"
                placeholder="Search my courses"
                value={filter}
                onChange={(event) => update('find', event.target.value)}
              />
              <button
                type="submit"
                className="grid w-11 shrink-0 place-items-center bg-brand text-white hover:bg-brand-hover [&_svg]:h-4 [&_svg]:w-4"
                aria-label="Search"
              >
                <SearchIcon />
              </button>
            </form>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-charcoal">
            {tab.key === 'wishlist'
              ? `${visible.length} course${visible.length === 1 ? '' : 's'}`
              : tab.key === 'archived'
                ? '0 courses'
                : `${visible.length} course${visible.length === 1 ? '' : 's'}`}
          </p>
          {showFilters ? (
            <label className="relative inline-flex items-center gap-2 text-sm font-semibold text-charcoal">
              <span className="sr-only">Sort</span>
              <select
                className="s-field appearance-none rounded border-hairline bg-white py-1.5 pl-3 pr-8 text-sm font-semibold"
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
          ) : null}
        </div>

        <div aria-live="polite">
          {tab.key === 'wishlist' ? (
            visible.length ? (
              <ul className="grid gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {visible.map((item) => (
                  <li key={item.key || item.slug || item.courseId}>
                    <FavoriteCard item={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <StudentEmpty
                title={needle ? 'No wishlist matches' : 'Your wishlist is empty'}
                message={needle ? 'Try a different search.' : 'Save courses from Explore to see them here.'}
                action={!needle ? <Link to="/learn/courses" className="btn-brand">Explore courses</Link> : null}
              />
            )
          ) : tab.key === 'archived' ? (
            <StudentEmpty
              title="No archived courses"
              message="Courses you archive will show up here."
            />
          ) : visible.length ? (
            <ul className="grid gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {visible.map((row) => {
                const id = String(row.courseId || row.id);
                return (
                  <li key={row.id}>
                    <LearningCourseCard
                      enrollment={row}
                      bookmarked={favoriteIds.has(id)}
                      menuOpen={menuId === id}
                      onMenuToggle={() => setMenuId((cur) => (cur === id ? null : id))}
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
              title={needle || category !== 'all' || progress !== 'all' || instructor !== 'all'
                ? 'No courses match'
                : tab.key === 'completed'
                  ? 'No completed courses yet'
                  : tab.key === 'active'
                    ? 'No courses in progress'
                    : 'You have not enrolled yet'}
              message={
                needle || category !== 'all' || progress !== 'all' || instructor !== 'all'
                  ? 'Try a different filter or search.'
                  : 'Enroll in a published course and it will appear here.'
              }
              action={!rows.length ? <Link to="/learn/courses" className="btn-brand">Explore courses</Link> : null}
            />
          )}
        </div>
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
