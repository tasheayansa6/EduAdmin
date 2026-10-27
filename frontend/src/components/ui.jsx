import { useEffect, useState } from 'react';
import { statusLabel } from '../lib/format.js';

export function BootScreen() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="grid min-h-screen place-items-center px-4" aria-busy="true">
      <div className="max-w-sm text-center">
        <p className="text-sm font-semibold text-ink-muted">Loading EduAdmin…</p>
        {slow ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-ink-muted">
              This is taking longer than usual. The API may be waking up — wait a few seconds, then retry.
            </p>
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PageIntro({ children, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">{children}</p>
      {action}
    </div>
  );
}

export function Filters({ onSubmit, children }) {
  return (
    <form onSubmit={onSubmit} className="mb-5 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:flex-wrap sm:items-end sm:gap-4 sm:p-5">
      {children}
    </form>
  );
}

export function Field({ id, label, error, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-ink">{label}</label>
      {children}
      {error ? <p id={`${id}-error`} className="mt-1 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}

function described(id, error) {
  return error ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {};
}

export function TextInput({ id, error, ...props }) {
  return <input id={id} className="field" {...described(id, error)} {...props} />;
}

export function PasswordInput({ id, error, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        className="field pr-16"
        type={visible ? 'text' : 'password'}
        {...described(id, error)}
        {...props}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-2 text-xs font-semibold text-ink-muted hover:text-ink"
        aria-pressed={visible}
        aria-controls={id}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export function SelectInput({ id, error, children, ...props }) {
  return <select id={id} className="field" {...described(id, error)} {...props}>{children}</select>;
}

export function TextArea({ id, error, className = '', ...props }) {
  return <textarea id={id} className={`field ${className}`.trim()} {...described(id, error)} {...props} />;
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close dialog" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title" className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-lift ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <h2 id="dialog-title" className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const tones = {
    active: 'bg-emerald-50 text-emerald-900',
    published: 'bg-emerald-50 text-emerald-900',
    completed: 'bg-emerald-50 text-emerald-900',
    approved: 'bg-emerald-50 text-emerald-900',
    inactive: 'bg-slate-100 text-slate-700',
    draft: 'bg-amber-50 text-amber-950',
    new: 'bg-sky-50 text-sky-950',
    reviewing: 'bg-amber-50 text-amber-950',
    rejected: 'bg-red-50 text-red-900',
    withdrawn: 'bg-slate-100 text-slate-700',
    not_started: 'bg-slate-100 text-slate-700',
    suspended: 'bg-red-50 text-red-900',
    in_progress: 'bg-sky-50 text-sky-950',
  };
  return (
    <span className={`inline-flex items-center rounded-full border border-transparent px-2.5 py-1 text-xs font-semibold ${tones[status] || 'bg-slate-100 text-slate-700'}`}>
      {statusLabel(status)}
    </span>
  );
}

export function Avatar({ name, size = 'md', tone = 'accent' }) {
  const initials = String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || '?';
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-11 w-11 text-base',
    xl: 'h-20 w-20 text-2xl',
  };
  const tones = {
    accent: 'bg-accent/10 text-accent',
    brand: 'bg-brand-soft text-brand',
  };
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold ${tones[tone] || tones.accent} ${sizes[size] || sizes.md}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({ label, value, detail, icon: Icon, tone = 'accent' }) {
  const tones = {
    accent: 'bg-teal-50 text-accent',
    sky: 'bg-sky-50 text-sky-800',
    amber: 'bg-amber-50 text-amber-900',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <article className="surface-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-ink">{value}</p>
        </div>
        {Icon ? (
          <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tones[tone] || tones.accent}`}>
            <Icon />
          </span>
        ) : null}
      </div>
      {detail ? <p className="mt-3 text-sm text-ink-muted">{detail}</p> : null}
    </article>
  );
}

export function ProgressBar({ value }) {
  if (value == null || Number.isNaN(Number(value))) {
    return <span className="text-sm text-ink-muted">No progress data</span>;
  }
  const percent = Math.max(0, Math.min(100, Number(value)));
  return (
    <div className="flex min-w-[8rem] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${percent}% complete`}>
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums">{percent}%</span>
    </div>
  );
}

export function BarChart({ points, emptyMessage = 'No data in this period yet.', hideWhenZero = true }) {
  const total = points.reduce((sum, point) => sum + point.count, 0);
  if (!points.length || (hideWhenZero && total === 0)) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg bg-slate-50 px-4 text-center">
        <p className="text-sm text-ink-muted">{emptyMessage}</p>
      </div>
    );
  }
  const max = Math.max(1, ...points.map((point) => point.count));
  return (
    <div role="img" aria-label={`Enrollment trend: ${points.map((p) => `${p.label} ${p.count}`).join(', ')}`}>
      <div className="flex h-44 items-end gap-2 sm:gap-3">
        {points.map((point) => (
          <div key={point.month} className="group flex h-full flex-1 flex-col justify-end">
            <div
              className="w-full rounded-t-md bg-accent/90 transition-colors group-hover:bg-accent"
              style={{ height: `${Math.max(point.count ? 10 : 0, (point.count / max) * 100)}%` }}
              title={`${point.label}: ${point.count}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2 sm:gap-3">
        {points.map((point) => (
          <div key={`${point.month}-label`} className="min-w-0 flex-1 text-center text-xs text-ink-muted">
            <div className="font-semibold tabular-nums text-ink">{point.count}</div>
            <div className="truncate">{point.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SplitBar({ parts }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={parts.map((part) => `${part.label} ${part.value}`).join(', ')}>
        {parts.map((part) => (
          <div key={part.label} className={part.className} style={{ width: `${(part.value / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {parts.map((part) => (
          <li key={`${part.label}-row`} className="flex items-center justify-between gap-3">
            <span>{part.label}</span>
            <span className="font-semibold tabular-nums">{part.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta?.total) return null;
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-muted">Showing {start}–{end} of {meta.total}</p>
      {meta.totalPages > 1 ? (
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => onPage(meta.page - 1)} disabled={meta.page <= 1}>Previous</button>
          <button type="button" className="btn-secondary" onClick={() => onPage(meta.page + 1)} disabled={meta.page >= meta.totalPages}>Next</button>
        </div>
      ) : null}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="rounded-lg border border-line bg-white px-6 py-10 text-center shadow-card" role="alert">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{message || 'The information could not be loaded.'}</p>
      {onRetry ? <button type="button" className="btn-secondary mt-4" onClick={onRetry}>Try again</button> : null}
    </div>
  );
}

export function EmptyState({ title, message }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white px-6 py-10 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">{message}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="table-wrap" aria-busy="true">
      <span className="sr-only">Loading records</span>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="h-8 animate-pulse rounded bg-slate-200" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]" aria-busy="true">
      <span className="sr-only">Loading dashboard</span>
      <div className="space-y-5">
        <div className="h-36 animate-pulse rounded-xl bg-slate-200" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
        <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
      </div>
      <div className="space-y-4">
        <div className="h-36 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export function DataPanel({
  status,
  error,
  onRetry,
  isEmpty = false,
  emptyTitle,
  emptyMessage,
  skeleton,
  children,
}) {
  if (status === 'loading') return skeleton;
  if (status === 'error') return <ErrorState message={error?.message} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState title={emptyTitle} message={emptyMessage} />;
  return children;
}

export function Panel({ title, description, children, className = '', action }) {
  return (
    <section className={`surface-card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
