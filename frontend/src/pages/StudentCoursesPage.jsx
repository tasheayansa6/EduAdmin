import { useSearchParams } from 'react-router-dom';
import { SearchIcon } from '../components/icons.jsx';
import { useAllCourses, useDocumentTitle } from '../student/StudentData.jsx';
import { CARD_GRID, CatalogCard, PageSkeleton, PageTitle, StudentEmpty } from '../student/components.jsx';

const SORTS = {
  newest: { label: 'Newest', compare: (a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0) },
  'title-asc': { label: 'Title A–Z', compare: (a, b) => a.title.localeCompare(b.title) },
  'price-asc': { label: 'Price: low to high', compare: (a, b) => a.price - b.price || a.title.localeCompare(b.title) },
  'price-desc': { label: 'Price: high to low', compare: (a, b) => b.price - a.price || a.title.localeCompare(b.title) },
};

const SHOW = {
  all: { label: 'All courses', test: () => true },
  free: { label: 'Free', test: (course) => course.isFree },
  paid: { label: 'Paid', test: (course) => !course.isFree },
  enrolled: { label: 'Enrolled', test: (course) => Boolean(course.enrollment) },
  favorites: { label: 'Favorites', test: (course) => course.favorite },
};

function SearchBox({ value, onSearch }) {
  function onSubmit(event) {
    event.preventDefault();
    onSearch(String(new FormData(event.currentTarget).get('q') || '').trim());
  }
  return (
    <form onSubmit={onSubmit} role="search" className="w-full sm:max-w-sm">
      <label htmlFor="course-search" className="sr-only">Search courses</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-charcoal-muted [&_svg]:h-[18px] [&_svg]:w-[18px]">
          <SearchIcon />
        </span>
        <input
          key={value}
          id="course-search"
          name="q"
          type="search"
          defaultValue={value}
          placeholder="Search by title, topic, or instructor"
          className="w-full rounded-full border border-hairline bg-white py-2.5 pl-10 pr-4 text-sm text-charcoal shadow-soft placeholder:text-charcoal-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </div>
    </form>
  );
}

function ExploreBody({ catalog }) {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const category = params.get('category') || '';
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'newest';
  const show = SHOW[params.get('show')] ? params.get('show') : 'all';

  const categories = [...catalog.reduce((map, course) => map.set(course.category, (map.get(course.category) || 0) + 1), new Map())]
    .filter(([name]) => name)
    .sort((a, b) => a[0].localeCompare(b[0]));
  const needle = q.toLowerCase();
  const results = catalog
    .filter((course) => !category || course.category === category)
    .filter((course) => !needle || [course.title, course.subtitle, course.category, course.instructorName].join(' ').toLowerCase().includes(needle))
    .filter(SHOW[show].test)
    .sort(SORTS[sort].compare);

  function update(key, value, fallback) {
    const next = new URLSearchParams(params);
    if (!value || value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  const filtered = Boolean(q || category || show !== 'all');

  return (
    <>
      <PageTitle
        title="Courses"
        description={`${catalog.length} published course${catalog.length === 1 ? '' : 's'}. New courses appear here as soon as an administrator publishes them.`}
      >
        <SearchBox value={q} onSearch={(text) => update('q', text)} />
      </PageTitle>

      <div className="mb-6 space-y-4">
        {categories.length ? (
          <div role="group" aria-label="Filter by category" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <button type="button" className={category ? 'chip-off' : 'chip-on'} aria-pressed={!category} onClick={() => update('category', '')}>
              All
              <span className={category ? 'text-charcoal-muted' : 'text-white/70'}>{catalog.length}</span>
            </button>
            {categories.map(([name, count]) => (
              <button key={name} type="button" className={category === name ? 'chip-on' : 'chip-off'} aria-pressed={category === name} onClick={() => update('category', name)}>
                {name}
                <span className={category === name ? 'text-white/70' : 'text-charcoal-muted'}>{count}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-y border-hairline py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-charcoal-muted" aria-live="polite">
            <span className="font-bold text-charcoal">{results.length}</span> result{results.length === 1 ? '' : 's'}
            {q ? <> for <span className="font-semibold text-charcoal">“{q}”</span></> : null}
            {q ? (
              <button type="button" className="ml-2 font-semibold text-brand underline-offset-2 hover:underline" onClick={() => update('q', '')}>
                Clear search
              </button>
            ) : null}
          </p>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
              <span className="shrink-0">Show</span>
              <select className="s-field py-2" value={show} onChange={(event) => update('show', event.target.value, 'all')}>
                {Object.entries(SHOW).map(([key, option]) => <option key={key} value={key}>{option.label}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
              <span className="shrink-0">Sort</span>
              <select className="s-field py-2" value={sort} onChange={(event) => update('sort', event.target.value, 'newest')}>
                {Object.entries(SORTS).map(([key, option]) => <option key={key} value={key}>{option.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      {results.length ? (
        <ul className={CARD_GRID}>
          {results.map((course) => <li key={course.key}><CatalogCard course={course} /></li>)}
        </ul>
      ) : (
        <StudentEmpty
          title={catalog.length ? 'No courses match' : 'No published courses yet'}
          message={catalog.length ? 'Try another search term, category, or filter.' : 'Courses appear here once an administrator publishes them.'}
          action={filtered ? <button type="button" className="btn-outline" onClick={() => setParams({}, { replace: true })}>Reset filters</button> : null}
        />
      )}
    </>
  );
}

export function StudentCoursesPage() {
  useDocumentTitle('Courses');
  const { courses, loading } = useAllCourses();
  if (loading) return <PageSkeleton label="Loading courses" />;
  return <ExploreBody catalog={courses} />;
}
