import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export const CHART = {
  brand: '#15432a',
  soft: '#b9d4c2',
  muted: '#e8f1ea',
  wheat: '#eab308',
};

export function ChartTip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-hairline bg-white px-3 py-2 shadow-lift">
      {label ? <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">{label}</p> : null}
      <p className="text-sm font-bold text-brand">
        {payload[0].value}{unit}
      </p>
    </div>
  );
}

/** Circular progress ring used on Learning / Explore. */
export function PaceRing({ value, size = 'md', label = 'Done' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const data = [
    { name: 'done', value: pct, fill: CHART.brand },
    { name: 'rest', value: Math.max(0.01, 100 - pct), fill: CHART.muted },
  ];
  const box = size === 'lg' ? 'h-28 w-28' : 'h-20 w-20';
  const text = size === 'lg' ? 'text-2xl' : 'text-base';

  return (
    <div className={`relative shrink-0 ${box}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="70%"
            outerRadius="92%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p className={`font-display font-bold leading-none text-brand ${text}`}>{pct}%</p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-charcoal-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

/** Compact weekly bars from real lesson_progress counts. */
export function MiniWeekChart({ weekly, height = 96 }) {
  const data = useMemo(() => {
    const days = weekly?.days || [];
    const today = new Date().toISOString().slice(0, 10);
    return days.map((row) => ({
      day: row.day,
      lessons: Number(row.lessons) || 0,
      fill: row.date === today ? CHART.brand : CHART.soft,
    }));
  }, [weekly]);
  const total = weekly?.thisWeek ?? data.reduce((sum, row) => sum + row.lessons, 0);

  return (
    <div>
      <div className="mb-1 flex items-end justify-between gap-2">
        <p className="text-xs font-bold text-charcoal">{total} lesson{total === 1 ? '' : 's'} this week</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-muted">Activity</p>
      </div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="22%">
            <Tooltip content={<ChartTip />} cursor={{ fill: CHART.muted }} />
            <Bar dataKey="lessons" radius={[6, 6, 2, 2]} maxBarSize={28}>
              {data.map((entry) => (
                <Cell key={entry.day} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex justify-between px-0.5">
        {data.map((entry) => (
          <span key={entry.day} className="text-[9px] font-semibold text-charcoal-muted">{entry.day[0]}</span>
        ))}
      </div>
    </div>
  );
}
