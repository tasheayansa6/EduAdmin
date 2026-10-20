import { Link, useSearchParams } from 'react-router-dom';
import { useDocumentTitle, useStudentData } from '../student/StudentData.jsx';
import { CARD_GRID, LearningCard, PageTitle, StudentData, StudentEmpty } from '../student/components.jsx';

const TABS = [
  { key: 'all', label: 'All courses', test: (row) => row.status !== 'withdrawn' },
  { key: 'active', label: 'Active', test: (row) => row.status === 'active' },
  { key: 'completed', label: 'Completed', test: (row) => row.status === 'completed' },
  { key: 'withdrawn', label: 'Withdrawn', test: (row) => row.status === 'withdrawn' },
];

const EMPTY = {
  all: ['You have not enrolled in a course yet', 'Enroll in a published course and it will appear here with its progress.'],
  active: ['No active courses', 'Courses you are taking now will appear here.'],
  completed: ['No completed courses yet', 'Courses marked completed will appear here.'],
  withdrawn: ['No withdrawn courses', 'Courses you leave will appear here.'],
};

function LearningBody({ data }) {
  const [params, setParams] = useSearchParams();
  const rows = data.enrollments ?? [];
  const counts = Object.fromEntries(TABS.map((tab) => [tab.key, rows.filter(tab.test).length]));
  const tabs = TABS.filter((tab) => tab.key !== 'withdrawn' || counts.withdrawn > 0);
  const tab = tabs.find((item) => item.key === params.get('tab')) ?? tabs[0];
  const filter = params.get('find') || '';
  const needle = filter.trim().toLowerCase();
  const visible = rows
    .filter(tab.test)
    .filter((row) => !needle || `${row.courseTitle} ${row.categoryName}`.toLowerCase().includes(needle))
    .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));

  function update(key, value, fallback) {
    const next = new URLSearchParams(params);
    if (!value || value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  const [emptyTitle, emptyMessage] = needle ? ['No courses match', 'Try a different course title or category.'] : EMPTY[tab.key];

  return (
    <>
      <PageTitle title="My learning" description="Courses on your learning record, with the progress stored for each one." />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div role="group" aria-label="Filter by enrollment status" className="-mx-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-hairline px-4 sm:mx-0 sm:px-0">
          {tabs.map((item) => {
            const selected = item.key === tab.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={selected}
                className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${selected ? 'border-charcoal text-charcoal' : 'border-transparent text-charcoal-muted hover:text-charcoal'}`}
                onClick={() => update('tab', item.key, 'all')}
              >
                {item.label}
                <span className="ml-1.5 tabular-nums text-charcoal-muted">{counts[item.key]}</span>
              </button>
            );
          })}
        </div>
        <div className="w-full lg:max-w-xs">
          <label htmlFor="my-learning-find" className="sr-only">Search my courses</label>
          <input
            id="my-learning-find"
            type="search"
            className="s-field"
            placeholder="Search my courses"
            value={filter}
            onChange={(event) => update('find', event.target.value)}
          />
        </div>
      </div>

      <div aria-live="polite">
        {visible.length ? (
          <ul className={CARD_GRID}>
            {visible.map((row) => <li key={row.id}><LearningCard enrollment={row} /></li>)}
          </ul>
        ) : (
          <StudentEmpty
            title={emptyTitle}
            message={emptyMessage}
            action={!rows.length ? <Link to="/learn/courses" className="btn-brand">Explore courses</Link> : null}
          />
        )}
      </div>
    </>
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
