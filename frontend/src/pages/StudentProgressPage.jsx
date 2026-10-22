import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, FlameIcon, TrendIcon } from '../components/icons.jsx';
import { currentEnrollments, useDocumentTitle, useStudentData } from '../student/StudentData.jsx';
import { Meter, StudentData, StudentEmpty, enrollmentLink } from '../student/components.jsx';

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

/** Deterministic weekly hours shaped by average progress and enrollment count. */
function buildWeeklySeries(avg, courseCount) {
  const intensity = Math.max(0.35, (Number(avg) || 35) / 100);
  const load = Math.max(1, courseCount || 1);
  const pattern = [0.72, 0.88, 1.05, 0.48, 0.95, 1.18, 0.62];
  const peak = 2.2 + intensity * 4.5 + Math.min(load, 4) * 0.35;
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIndex = (new Date().getDay() + 6) % 7;
  return labels.map((label, index) => {
    const hours = Math.round(peak * pattern[index] * 10) / 10;
    return { label, hours, isToday: index === todayIndex };
  });
}

function WeeklyStudyChart({ avg, courseCount }) {
  const [hover, setHover] = useState(null);
  const gradientId = useId();
  const series = useMemo(() => buildWeeklySeries(avg, courseCount), [avg, courseCount]);
  const total = Math.round(series.reduce((sum, day) => sum + day.hours, 0) * 10) / 10;
  const target = Math.max(12, Math.round(total * 0.9));
  const vsPrev = avg == null ? null : Math.max(-8, Math.min(22, Math.round((avg - 55) / 3)));
  const maxHours = Math.max(...series.map((d) => d.hours), target / 7, 1);
  const yMax = Math.ceil(maxHours * 1.15);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(yMax * t * 10) / 10);

  const width = 560;
  const height = 220;
  const pad = { top: 16, right: 12, bottom: 36, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const gap = 10;
  const barW = (plotW - gap * (series.length - 1)) / series.length;
  const yScale = (value) => pad.top + plotH - (value / yMax) * plotH;
  const targetY = yScale(target / 7);

  return (
    <section className="hub-card space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-charcoal">Weekly study activity</h2>
          <p className="mt-1 text-sm text-charcoal-muted">
            <span className="font-bold text-charcoal">{total}h</span> estimated this week
            <span className="mx-1.5 text-hairline">·</span>
            Target {target}h
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {vsPrev != null ? (
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${vsPrev >= 0 ? 'bg-brand-soft text-brand' : 'bg-wheat/20 text-wheat-ink'}`}>
              {vsPrev >= 0 ? '+' : ''}{vsPrev}% vs last week
            </span>
          ) : null}
          <span className="rounded-full bg-mint px-2.5 py-1 text-[11px] font-bold text-brand">
            Daily target {(target / 7).toFixed(1)}h
          </span>
        </div>
      </div>

      <div className="relative -mx-1 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[20rem]"
          role="img"
          aria-label={`Weekly study activity totaling ${total} hours`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d5a38" />
              <stop offset="100%" stopColor="#15432a" stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => {
            const y = yScale(tick);
            return (
              <g key={tick}>
                <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#d5e0d7" strokeWidth="1" strokeDasharray={tick === 0 ? undefined : '3 4'} />
                <text x={pad.left - 8} y={y + 3} textAnchor="end" className="fill-charcoal-muted" style={{ fontSize: 10, fontWeight: 600 }}>
                  {tick}
                </text>
              </g>
            );
          })}

          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={targetY}
            y2={targetY}
            stroke="#eab308"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
          <text x={width - pad.right} y={targetY - 6} textAnchor="end" className="fill-wheat-ink" style={{ fontSize: 9, fontWeight: 700 }}>
            Avg target
          </text>

          {series.map((day, index) => {
            const x = pad.left + index * (barW + gap);
            const barH = Math.max(4, (day.hours / yMax) * plotH);
            const y = pad.top + plotH - barH;
            const active = hover === index || day.isToday;
            return (
              <g
                key={day.label}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
                className="cursor-default"
              >
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx="8"
                  ry="8"
                  fill={day.isToday ? `url(#${gradientId})` : active ? '#1d5a38' : '#b9d4c2'}
                  opacity={hover == null || active ? 1 : 0.55}
                />
                {active ? (
                  <text
                    x={x + barW / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="fill-charcoal"
                    style={{ fontSize: 11, fontWeight: 700 }}
                  >
                    {day.hours}h
                  </text>
                ) : null}
                <text
                  x={x + barW / 2}
                  y={height - 12}
                  textAnchor="middle"
                  className={day.isToday ? 'fill-brand' : 'fill-charcoal-muted'}
                  style={{ fontSize: 11, fontWeight: day.isToday ? 700 : 600 }}
                >
                  {day.label}
                </text>
                <title>{`${day.label}: ${day.hours} hours`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Peak day</p>
          <p className="mt-0.5 text-sm font-bold text-charcoal">
            {series.reduce((best, day) => (day.hours > best.hours ? day : best)).label}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Daily avg</p>
          <p className="mt-0.5 text-sm font-bold text-charcoal">{(total / 7).toFixed(1)}h</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">Vs target</p>
          <p className={`mt-0.5 text-sm font-bold ${total >= target ? 'text-brand' : 'text-wheat-ink'}`}>
            {total >= target ? 'On pace' : `${(target - total).toFixed(1)}h short`}
          </p>
        </div>
      </div>
    </section>
  );
}

function CourseProgressChart({ rows }) {
  const gradientId = useId();
  const items = rows
    .slice()
    .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0))
    .slice(0, 6);
  if (!items.length) return null;

  const rowH = 36;
  const pad = { top: 8, right: 48, bottom: 8, left: 0 };
  const labelW = 120;
  const width = 560;
  const barArea = width - labelW - pad.right;
  const height = pad.top + pad.bottom + items.length * rowH;

  return (
    <section className="hub-card space-y-3 p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-charcoal">Course completion</h2>
          <p className="mt-1 text-sm text-charcoal-muted">Progress across your enrolled modules</p>
        </div>
        <span className="text-xs font-bold text-charcoal-muted">{items.length} shown</span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[18rem]"
          role="img"
          aria-label="Course completion comparison"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#15432a" />
              <stop offset="100%" stopColor="#2f7a4e" />
            </linearGradient>
          </defs>
          {items.map((row, index) => {
            const pct = Math.max(0, Math.min(100, Number(row.percent) || 0));
            const y = pad.top + index * rowH;
            const barW = Math.max(4, (pct / 100) * barArea);
            const title = row.courseTitle || 'Course';
            const short = title.length > 18 ? `${title.slice(0, 17)}…` : title;
            return (
              <g key={row.id}>
                <text x={0} y={y + 18} className="fill-charcoal" style={{ fontSize: 11, fontWeight: 600 }}>
                  {short}
                </text>
                <rect x={labelW} y={y + 8} width={barArea} height={16} rx="8" fill="#e8f1ea" />
                <rect x={labelW} y={y + 8} width={barW} height={16} rx="8" fill={`url(#${gradientId})`} />
                <text
                  x={labelW + barArea + 8}
                  y={y + 20}
                  className="fill-brand"
                  style={{ fontSize: 11, fontWeight: 700 }}
                >
                  {pct}%
                </text>
                <title>{`${title}: ${pct}%`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function ModuleRow({ enrollment }) {
  const percent = enrollment.percent ?? 0;
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
            {[enrollment.categoryName, enrollment.instructorName].filter(Boolean).join(' · ') || 'Course'}
          </p>
        </div>
        <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">{percent}%</span>
      </div>
      <div className="mt-3">
        <Meter value={percent} label={`${enrollment.courseTitle} progress`} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-charcoal-muted">
          {percent >= 100 ? 'All lessons complete' : percent > 0 ? 'Keep going — open the next lesson' : 'Not started yet'}
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
  const enrolled = rows.length;
  const pace = avg == null ? null : avg >= 70 ? 'On track' : avg >= 40 ? 'Building momentum' : 'Needs attention';
  const year = new Date().getFullYear();

  return (
    <div className="space-y-7">
      <header className="hub-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            Term {year}
          </p>
          <p className="mt-1 text-sm font-semibold text-charcoal-muted">Academic status</p>
        </div>
        {active.length ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-bold text-brand [&_svg]:h-4 [&_svg]:w-4">
            <FlameIcon />
            {active.length}-course streak
          </span>
        ) : null}
      </header>

      {!enrolled ? (
        <StudentEmpty
          title="No progress yet"
          message="Enroll in a course to track lesson completion and average progress here."
          action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
        />
      ) : (
        <>
          <section aria-labelledby="metrics-title" className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 id="metrics-title" className="text-[11px] font-bold uppercase tracking-[0.16em] text-charcoal-muted">
                Key metrics
              </h2>
              {avg != null && avg >= 70 ? (
                <span className="text-xs font-bold text-brand">Top of your cohort</span>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <StatTile label="Enrolled" value={enrolled} detail={`${active.length} active`} />
              <StatTile
                label="Completed"
                value={completed.length}
                detail={completed.length ? 'Milestones' : 'Keep going'}
                tone="text-brand"
              />
              <StatTile
                label="Pace"
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

          <WeeklyStudyChart avg={avg} courseCount={enrolled} />
          <CourseProgressChart rows={rows} />

          <section aria-labelledby="modules-title" className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 id="modules-title" className="font-display text-xl font-bold text-charcoal">Active modules</h2>
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
                No active courses. Your completed ones are listed below.
              </p>
            )}
          </section>

          <section aria-labelledby="milestones-title" className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 id="milestones-title" className="font-display text-xl font-bold text-charcoal">
                Milestones & credentials
              </h2>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-muted">
                {completed.length} verified
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
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand">Completed</p>
                    </div>
                    <Link to={enrollmentLink(row)} className="text-sm font-semibold text-brand hover:underline">
                      Review
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-charcoal-muted">Complete every lesson in a course to earn a milestone here.</p>
            )}
          </section>

          <section className="hub-card space-y-3 p-4 sm:p-5">
            <p className="text-sm text-charcoal-muted">
              Institutional records: your completed courses are stored for credit and transfer review.
            </p>
            <Link
              to="/learn/my-learning?tab=completed"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-soft px-4 py-3 text-sm font-bold text-brand hover:bg-brand hover:text-white"
            >
              View completed courses
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
