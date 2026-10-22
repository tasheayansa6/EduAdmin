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

export function buildWeeklyHours(avg, courseCount) {
  const intensity = Math.max(0.4, (Number(avg) || 42) / 100);
  const load = Math.max(1, Math.min(courseCount || 1, 5));
  const base = [3.5, 4.2, 5.0, 2.1, 4.8, 6.2, 3.0];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const scale = 0.55 + intensity * 0.7 + load * 0.04;
  const todayIndex = (new Date().getDay() + 6) % 7;
  return labels.map((day, index) => ({
    day,
    hours: Math.round(base[index] * scale * 10) / 10,
    fill: index === todayIndex ? CHART.brand : CHART.soft,
  }));
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

/** Compact weekly bars for Learning / Explore headers. */
export function MiniWeekChart({ avg, courseCount, height = 96 }) {
  const data = useMemo(() => buildWeeklyHours(avg, courseCount), [avg, courseCount]);
  const total = Math.round(data.reduce((sum, row) => sum + row.hours, 0) * 10) / 10;

  return (
    <div>
      <div className="mb-1 flex items-end justify-between gap-2">
        <p className="text-xs font-bold text-charcoal">{total}h this week</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal-muted">Study hours</p>
      </div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="22%">
            <Tooltip content={<ChartTip unit="h" />} cursor={{ fill: CHART.muted }} />
            <Bar dataKey="hours" radius={[6, 6, 2, 2]} maxBarSize={28}>
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
