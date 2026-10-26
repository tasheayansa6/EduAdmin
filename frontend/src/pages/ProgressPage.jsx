import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, buildQuery } from '../api/client.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useListParams } from '../hooks/useListParams.js';
import { useResource } from '../hooks/useResource.js';
import { formatDate } from '../lib/format.js';
import { CHART, ChartTip } from '../student/charts.jsx';
import {
  DataPanel,
  Field,
  Filters,
  PageHeader,
  Pagination,
  ProgressBar,
  SelectInput,
  StatusBadge,
  TableSkeleton,
  TextInput,
} from '../components/ui.jsx';

const GRID = '#d5e0d7';
const BRAND = CHART.brand;
const BRAND_SOFT = CHART.soft;
const BRAND_MUTED = CHART.muted;

function StatTile({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">{value}</p>
      {detail ? <p className="mt-1 text-xs font-semibold text-ink-muted">{detail}</p> : null}
    </div>
  );
}

function WeeklyActivityChart({ weekly }) {
  const data = useMemo(() => {
    const days = weekly?.days || [];
    const today = new Date().toISOString().slice(0, 10);
    return days.map((row) => ({
      day: row.day,
      lessons: Number(row.lessons) || 0,
      fill: row.date === today ? BRAND : BRAND_SOFT,
    }));
  }, [weekly]);

  const thisWeek = weekly?.thisWeek ?? data.reduce((sum, row) => sum + row.lessons, 0);
  const prevWeek = weekly?.prevWeek ?? 0;
  const vsPrev = prevWeek === 0
    ? (thisWeek > 0 ? 100 : 0)
    : Math.round(((thisWeek - prevWeek) / prevWeek) * 100);
  const peak = data.reduce((best, row) => (row.lessons > best.lessons ? row : best), { day: '—', lessons: 0 });

  return (
    <section className="surface-card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Weekly lesson activity</h2>
          <p className="mt-1 text-sm text-ink-muted">
            <span className="font-bold text-ink">{thisWeek} lesson{thisWeek === 1 ? '' : 's'}</span>
            {' '}completed across all students (last 7 days)
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${vsPrev >= 0 ? 'bg-accent/10 text-accent' : 'bg-amber-50 text-amber-900'}`}>
          {vsPrev >= 0 ? '+' : ''}{vsPrev}% vs prior week
        </span>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 8, left: -8, bottom: 0 }} barCategoryGap="18%">
            <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<ChartTip />} cursor={{ fill: BRAND_MUTED, radius: 8 }} />
            <Bar dataKey="lessons" radius={[10, 10, 4, 4]} maxBarSize={48}>
              {data.map((entry) => (
                <Cell key={entry.day} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Peak day</p>
          <p className="mt-0.5 text-sm font-bold text-ink">
            {peak.lessons ? `${peak.day} · ${peak.lessons}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Daily avg</p>
          <p className="mt-0.5 text-sm font-bold text-ink">{(thisWeek / 7).toFixed(1)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Prior week</p>
          <p className="mt-0.5 text-sm font-bold text-ink">{prevWeek}</p>
        </div>
      </div>
    </section>
  );
}

function CourseProgressChart({ courses }) {
  const data = useMemo(() => (
    (courses || []).map((row) => {
      const title = row.title || 'Course';
      return {
        id: row.id,
        name: title.length > 18 ? `${title.slice(0, 17)}…` : title,
        fullName: title,
        percent: Math.max(0, Math.min(100, Number(row.averagePercent) || 0)),
        learners: row.learners,
      };
    })
  ), [courses]);

  if (!data.length) {
    return (
      <section className="surface-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold text-ink">Course completion</h2>
        <p className="mt-6 text-center text-sm text-ink-muted">No course averages yet.</p>
      </section>
    );
  }

  const chartHeight = Math.max(180, data.length * 44);

  return (
    <section className="surface-card space-y-3 p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Course completion</h2>
          <p className="mt-1 text-sm text-ink-muted">Average progress by course</p>
        </div>
        <span className="text-xs font-bold text-ink-muted">{data.length} shown</span>
      </div>
      <div style={{ height: chartHeight }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }} barCategoryGap="22%">
            <CartesianGrid stroke={GRID} strokeDasharray="3 4" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={112}
              tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-soft">
                    <p className="text-xs font-bold text-ink">{item.fullName}</p>
                    <p className="mt-0.5 text-sm font-bold text-accent">{item.percent}%</p>
                    <p className="text-[11px] text-ink-muted">{item.learners} learner{item.learners === 1 ? '' : 's'}</p>
                  </div>
                );
              }}
              cursor={{ fill: BRAND_MUTED }}
            />
            <Bar dataKey="percent" fill={BRAND} radius={[0, 10, 10, 0]} maxBarSize={22} background={{ fill: BRAND_MUTED, radius: 10 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function PaceDonut({ summary }) {
  const pace = Math.max(0, Math.min(100, Number(summary?.averageProgress) || 0));
  const avgData = [
    { name: 'Complete', value: pace || 0.01, fill: BRAND },
    { name: 'Remaining', value: Math.max(0.01, 100 - pace), fill: BRAND_MUTED },
  ];
  const mix = [
    { name: 'Not started', value: summary?.notStarted || 0, fill: '#94a3b8' },
    { name: 'In progress', value: summary?.inProgress || 0, fill: BRAND },
    { name: 'Completed', value: summary?.completed || 0, fill: BRAND_SOFT },
  ].filter((item) => item.value > 0);

  return (
    <section className="surface-card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Average progress</h2>
        <p className="mt-1 text-sm text-ink-muted">Across filtered enrollments</p>
        <div className="relative mx-auto mt-2 h-44 w-full max-w-[14rem]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={avgData}
                dataKey="value"
                innerRadius="68%"
                outerRadius="88%"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {avgData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTip unit="%" />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-accent">{summary?.tracked ? `${pace}%` : '—'}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Avg</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold text-ink">Progress mix</h2>
        <p className="mt-1 text-sm text-ink-muted">Not started · in progress · completed</p>
        {mix.length ? (
          <div className="mt-2 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="48%"
                  outerRadius="78%"
                  paddingAngle={3}
                  stroke="none"
                >
                  {mix.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-soft">
                        <p className="text-sm font-bold text-ink">{payload[0].name}: {payload[0].value}</p>
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-semibold text-ink">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-ink-muted">No progress mix yet</p>
        )}
      </div>
    </section>
  );
}

export function ProgressPage() {
  const list = useListParams();
  const debouncedDraft = useDebouncedValue(list.draft, 400);

  useEffect(() => {
    if (debouncedDraft.trim() === list.q) return;
    list.update({ q: debouncedDraft.trim(), status: list.status, courseId: list.courseId });
  }, [debouncedDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  const resource = useResource(
    () => api(`/api/v1/progress${buildQuery({
      q: list.q,
      status: list.status,
      courseId: list.courseId,
      page: list.page,
      limit: 8,
    })}`),
    [list.q, list.status, list.courseId, list.page],
  );
  const lookups = useResource(() => api('/api/v1/lookups'), []);
  const rows = resource.data?.data ?? [];
  const summary = resource.data?.summary;
  const filtered = Boolean(list.q || list.status || list.courseId);

  return (
    <>
      <PageHeader
        title="Learning progress"
        description="Charts from real lesson completions and stored progress. Use filters below to focus the table."
        actions={(
          <Link to="/enrollments" className="btn-secondary">View enrollments</Link>
        )}
      />

      {resource.status === 'loading' && !summary ? (
        <div className="mb-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : null}

      {summary ? (
        <div className="mb-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Tracked" value={summary.tracked.toLocaleString()} detail={filtered ? 'Matching filters' : 'All enrollments'} />
            <StatTile label="Avg progress" value={`${summary.averageProgress}%`} detail={summary.averageProgress >= 70 ? 'On track' : 'Watch'} />
            <StatTile label="Completed" value={summary.completed.toLocaleString()} detail="Programs at 100%" />
            <StatTile label="Below 40%" value={summary.belowForty.toLocaleString()} detail="Needs attention" />
          </div>

          <WeeklyActivityChart weekly={summary.weeklyActivity} />
          <PaceDonut summary={summary} />
          <CourseProgressChart courses={summary.byCourse} />
        </div>
      ) : null}

      <Filters onSubmit={(event) => event.preventDefault()}>
        <Field id="progress-search" label="Search" className="min-w-[16rem] flex-1">
          <TextInput
            id="progress-search"
            value={list.draft}
            onChange={(event) => list.setDraft(event.target.value)}
            placeholder="Type to search student or course"
            autoComplete="off"
          />
        </Field>
        <Field id="progress-course" label="Course">
          <SelectInput
            id="progress-course"
            value={list.courseId}
            onChange={(event) => list.update({ q: list.q, status: list.status, courseId: event.target.value })}
          >
            <option value="">All courses</option>
            {(lookups.data?.data.courses ?? []).map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </SelectInput>
        </Field>
        <Field id="progress-status" label="Progress status">
          <SelectInput
            id="progress-status"
            value={list.status}
            onChange={(event) => list.update({ q: list.q, status: event.target.value, courseId: list.courseId })}
          >
            <option value="">All progress</option>
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </SelectInput>
        </Field>
      </Filters>

      <DataPanel
        status={resource.status}
        error={resource.error}
        onRetry={resource.reload}
        isEmpty={rows.length === 0}
        emptyTitle={filtered ? 'No matching progress' : 'No progress records'}
        emptyMessage={
          filtered
            ? 'Try another student, course, or progress state.'
            : 'Progress rows are created when a student is enrolled. Withdrawn enrollments are excluded here.'
        }
        skeleton={<TableSkeleton />}
      >
        <div className="table-wrap overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Course</th>
                <th scope="col">Progress</th>
                <th scope="col">Status</th>
                <th scope="col">Enrollment</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-semibold text-ink">{row.studentName}</div>
                    <div className="text-sm text-ink-muted">{row.email}</div>
                  </td>
                  <td>{row.courseTitle}</td>
                  <td><ProgressBar value={row.percent} /></td>
                  <td><StatusBadge status={row.status} /></td>
                  <td><StatusBadge status={row.enrollmentStatus} /></td>
                  <td>{formatDate(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={resource.data?.meta} onPage={(page) => list.update({ page }, { resetPage: false })} />
        </div>
      </DataPanel>
    </>
  );
}
