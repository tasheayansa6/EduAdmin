import { useMemo } from 'react';
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
import { CheckIcon, TrendIcon } from '../components/icons.jsx';
import { CHART, ChartTip } from '../student/charts.jsx';
import { currentEnrollments, useDocumentTitle, useStudentData } from '../student/StudentData.jsx';
import { Meter, StudentData, StudentEmpty, enrollmentLink } from '../student/components.jsx';

const BRAND = CHART.brand;
const BRAND_SOFT = CHART.soft;
const BRAND_MUTED = CHART.muted;
const GRID = '#d5e0d7';

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

function StatTile({ label, value, detail, tone }) {
  return (
    <div className="hub-card p-3.5 sm:p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-charcoal-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-charcoal sm:text-3xl">{value}</p>
      {detail ? (
        <p className={`mt-1 text-xs font-semibold ${tone || 'text-charcoal-muted'}`}>{detail}</p>
      ) : null}
    </div>
  );
}

function WeeklyActivityChart({ weekly }) {
  const data = useMemo(() => {
    const days = weekly?.days || [];
    return days.map((row) => ({
      day: row.day,
      lessons: Number(row.lessons) || 0,
      fill: row.date === new Date().toISOString().slice(0, 10) ? BRAND : BRAND_SOFT,
    }));
  }, [weekly]);

  const thisWeek = weekly?.thisWeek ?? data.reduce((sum, row) => sum + row.lessons, 0);
  const prevWeek = weekly?.prevWeek ?? 0;
  const vsPrev = prevWeek === 0
    ? (thisWeek > 0 ? 100 : 0)
    : Math.round(((thisWeek - prevWeek) / prevWeek) * 100);
  const peak = data.reduce((best, row) => (row.lessons > best.lessons ? row : best), { day: '—', lessons: 0 });

  return (
    <section className="hub-card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-charcoal">Weekly lesson activity</h2>
          <p className="mt-1 text-sm text-charcoal-muted">
            <span className="font-bold text-charcoal">{thisWeek} lesson{thisWeek === 1 ? '' : 's'}</span>
            {' '}completed in the last 7 days
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${vsPrev >= 0 ? 'bg-brand-soft text-brand' : 'bg-wheat/20 text-wheat-ink'}`}>
            {vsPrev >= 0 ? '+' : ''}{vsPrev}% vs prior week
          </span>
        </div>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 8, left: -8, bottom: 0 }} barCategoryGap="18%">
            <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#59615b', fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#59615b', fontSize: 11, fontWeight: 600 }}
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

      <div className="grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Peak day</p>
          <p className="mt-0.5 text-sm font-bold text-charcoal">
            {peak.lessons ? `${peak.day} · ${peak.lessons}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Daily avg</p>
          <p className="mt-0.5 text-sm font-bold text-charcoal">{(thisWeek / 7).toFixed(1)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Prior week</p>
          <p className="mt-0.5 text-sm font-bold text-charcoal">{prevWeek}</p>
        </div>
      </div>
    </section>
  );
}

function CourseProgressChart({ rows }) {
  const data = useMemo(() => (
    rows
      .slice()
      .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))
      .slice(0, 6)
      .map((row) => {
        const title = row.courseTitle || 'Course';
        return {
          id: row.id,
          name: title.length > 16 ? `${title.slice(0, 15)}…` : title,
          fullName: title,
          percent: Math.max(0, Math.min(100, Number(row.percent) || 0)),
        };
      })
  ), [rows]);

  if (!data.length) return null;

  const chartHeight = Math.max(180, data.length * 44);

  return (
    <section className="hub-card space-y-3 p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-charcoal">Course completion</h2>
          <p className="mt-1 text-sm text-charcoal-muted">Progress from your lesson completions</p>
        </div>
        <span className="text-xs font-bold text-charcoal-muted">{data.length} shown</span>
      </div>
      <div style={{ height: chartHeight }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }} barCategoryGap="22%">
            <CartesianGrid stroke={GRID} strokeDasharray="3 4" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: '#59615b', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={108}
              tick={{ fill: '#191c1a', fontSize: 11, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload;
                return (
                  <div className="rounded-xl border border-hairline bg-white px-3 py-2 shadow-lift">
                    <p className="text-xs font-bold text-charcoal">{item.fullName}</p>
                    <p className="mt-0.5 text-sm font-bold text-brand">{item.percent}%</p>
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

function PaceDonut({ avg, active, completed }) {
  const pace = Math.max(0, Math.min(100, Number(avg) || 0));
  const data = [
    { name: 'Complete', value: pace, fill: BRAND },
    { name: 'Remaining', value: Math.max(0, 100 - pace), fill: BRAND_MUTED },
  ];
  const mix = [
    { name: 'Active', value: active, fill: BRAND },
    { name: 'Completed', value: completed, fill: BRAND_SOFT },
  ].filter((item) => item.value > 0);

  return (
    <section className="hub-card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
      <div>
        <h2 className="font-display text-lg font-bold text-charcoal">Average progress</h2>
        <p className="mt-1 text-sm text-charcoal-muted">Across your enrolled programs</p>
        <div className="relative mx-auto mt-2 h-44 w-full max-w-[14rem]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="68%"
                outerRadius="88%"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTip unit="%" />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-brand">{pace || '—'}{pace ? '%' : ''}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Avg</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-bold text-charcoal">Enrollment mix</h2>
        <p className="mt-1 text-sm text-charcoal-muted">Active vs completed programs</p>
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
                  content={({ active: tipActive, payload }) => {
                    if (!tipActive || !payload?.length) return null;
                    return (
                      <div className="rounded-xl border border-hairline bg-white px-3 py-2 shadow-lift">
                        <p className="text-sm font-bold text-charcoal">{payload[0].name}: {payload[0].value}</p>
                      </div>
                    );
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={28}
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-semibold text-charcoal">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-charcoal-muted">No enrollment mix yet</p>
        )}
      </div>
    </section>
  );
}

function ModuleRow({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  const lessonsDone = enrollment.lessonsCompleted ?? 0;
  const lessonsTotal = enrollment.lessonsTotal;
  const activity = formatRelative(enrollment.lastActivityAt);

  return (
    <li className="hub-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-charcoal">
            <Link to={enrollmentLink(enrollment)} className="hover:text-brand">
              {enrollment.courseTitle}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-charcoal-muted">
            {[enrollment.categoryName, enrollment.instructorName].filter(Boolean).join(' · ') || 'Program'}
          </p>
        </div>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">{percent}%</span>
      </div>
      <div className="mt-3">
        <Meter value={percent} label={`${enrollment.courseTitle} progress`} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-charcoal-muted">
          {lessonsTotal
            ? `${lessonsDone} of ${lessonsTotal} lessons`
            : percent >= 100
              ? 'All lessons complete'
              : percent > 0
                ? 'In progress'
                : 'Not started yet'}
          {activity ? ` · ${activity}` : ''}
        </span>
        <Link to={enrollmentLink(enrollment)} className="font-semibold text-brand hover:underline">
          Open player
        </Link>
      </div>
    </li>
  );
}

function ProgressBody({ data }) {
  const rows = currentEnrollments(data);
  const active = rows.filter((row) => row.status === 'active').sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
  const completed = rows.filter((row) => row.status === 'completed');
  const avg = data.summary?.averageProgress;
  const weekly = data.summary?.weeklyActivity;
  const enrolled = rows.length;
  const pace = avg == null ? null : avg >= 70 ? 'Strong pace' : avg >= 40 ? 'Building momentum' : 'Just getting started';

  return (
    <div className="space-y-7">
      <header className="hub-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Your progress</p>
          <p className="mt-1 text-sm font-semibold text-charcoal-muted">
            Based on real lesson completions in your account
          </p>
        </div>
        {weekly?.thisWeek ? (
          <span className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-bold text-brand">
            {weekly.thisWeek} lesson{weekly.thisWeek === 1 ? '' : 's'} this week
          </span>
        ) : null}
      </header>

      {!enrolled ? (
        <StudentEmpty
          title="No progress yet"
          message="Enroll in a program and complete lessons to see real progress here."
          action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
        />
      ) : (
        <>
          <section aria-labelledby="metrics-title" className="space-y-3">
            <h2 id="metrics-title" className="text-[11px] font-bold uppercase tracking-[0.16em] text-charcoal-muted">
              Key metrics
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              <StatTile label="Enrolled" value={enrolled} detail={`${active.length} active`} />
              <StatTile
                label="Completed"
                value={completed.length}
                detail={completed.length ? 'Programs finished' : 'Keep going'}
                tone="text-brand"
              />
              <StatTile
                label="Avg progress"
                value={avg == null ? '—' : `${avg}%`}
                detail={(
                  <span className="inline-flex items-center gap-1 [&_svg]:h-3.5 [&_svg]:w-3.5">
                    {pace}
                    {avg != null && avg >= 40 ? <TrendIcon /> : null}
                  </span>
                )}
                tone="text-brand"
              />
            </div>
          </section>

          <WeeklyActivityChart weekly={weekly} />
          <PaceDonut avg={avg} active={active.length} completed={completed.length} />
          <CourseProgressChart rows={rows} />

          <section aria-labelledby="modules-title" className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 id="modules-title" className="font-display text-xl font-bold text-charcoal">Active programs</h2>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-muted">{active.length} enrolled</p>
            </div>
            {active.length ? (
              <ul className="space-y-3">
                {active.map((row) => (
                  <ModuleRow key={row.id} enrollment={row} />
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl border border-dashed border-hairline bg-white px-4 py-8 text-center text-sm text-charcoal-muted">
                No active programs. Completed ones are listed below.
              </p>
            )}
          </section>

          <section aria-labelledby="milestones-title" className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 id="milestones-title" className="font-display text-xl font-bold text-charcoal">
                Completed
              </h2>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-muted">
                {completed.length} finished
              </p>
            </div>
            {completed.length ? (
              <ul className="space-y-2">
                {completed.map((row) => (
                  <li key={row.id} className="flex items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand [&_svg]:h-4 [&_svg]:w-4">
                      <CheckIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-charcoal">{row.courseTitle}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand">100% complete</p>
                    </div>
                    <Link to={enrollmentLink(row)} className="text-sm font-semibold text-brand hover:underline">
                      Review
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-charcoal-muted">Complete every lesson in a program to see it here.</p>
            )}
          </section>

          <section className="hub-card p-4 sm:p-5">
            <Link
              to="/learn/my-learning?tab=completed"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-soft px-4 py-3 text-sm font-bold text-brand hover:bg-brand hover:text-white"
            >
              View completed in My learning
            </Link>
          </section>
        </>
      )}
    </div>
  );
}

export function StudentProgressPage() {
  useDocumentTitle('Progress');
  const resource = useStudentData();
  return (
    <StudentData resource={resource} label="Loading your progress">
      {(data) => <ProgressBody data={data} />}
    </StudentData>
  );
}
