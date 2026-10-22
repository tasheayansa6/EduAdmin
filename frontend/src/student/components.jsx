import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { statusLabel } from '../lib/format.js';
import { ArrowRightIcon, CartIcon, CheckIcon, ClockIcon, HeartIcon } from '../components/icons.jsx';
import { useStore } from './StudentData.jsx';

export const CARD_GRID = 'grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

const COVER_TONES = [
  { bg: '#e4eee6', line: '#7fa58b' },
  { bg: '#fbf3d6', line: '#c9a53c' },
  { bg: '#e9efe1', line: '#98ad7a' },
  { bg: '#f3ece0', line: '#b89e78' },
  { bg: '#dfebe7', line: '#6f9c90' },
  { bg: '#f6f0dc', line: '#b8a160' },
];

function toneFor(key) {
  let hash = 0;
  for (const char of String(key || '')) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COVER_TONES[hash % COVER_TONES.length];
}

/** Courses have no image field, so every cover is the same neutral design tinted by category. */
export function CourseCover({ category, title, className = '' }) {
  const tone = toneFor(category);
  const initial = String(title || category || '').trim().charAt(0).toUpperCase();
  return (
    <div className={`relative aspect-[16/9] overflow-hidden ${className}`} style={{ backgroundColor: tone.bg }} aria-hidden="true">
      <svg className="absolute -right-6 -top-6 h-[120%] w-auto" viewBox="0 0 200 200" fill="none" stroke={tone.line} strokeWidth="1.2">
        <circle cx="140" cy="60" r="34" />
        <circle cx="140" cy="60" r="58" />
        <circle cx="140" cy="60" r="82" />
        <circle cx="140" cy="60" r="106" />
      </svg>
      <span className="absolute bottom-2 left-4 text-6xl font-bold leading-none" style={{ color: tone.line }}>
        {initial}
      </span>
    </div>
  );
}

/** Courses sold from AilgAdmin open by slug; older EduAdmin-only courses open by id. */
export function enrollmentLink(enrollment) {
  return enrollment.courseSlug
    ? `/learn/courses/${enrollment.courseSlug}/learn`
    : `/learn/my-courses/${enrollment.courseId}/learn`;
}

export function formatPrice(price, currency) {
  if (!Number(price)) return 'Free';
  return `${currency || 'ETB'} ${Number(price).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatMinutes(minutes) {
  const total = Number(minutes) || 0;
  if (!total) return null;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/** The course image from AilgAdmin, or the neutral cover when the course has none. */
export function CourseImage({ course, className = '' }) {
  const [broken, setBroken] = useState(false);
  if (!course.imageUrl || broken) {
    return <CourseCover category={course.category} title={course.title} className={className} />;
  }
  return (
    <div className={`aspect-[16/9] overflow-hidden bg-sand ${className}`}>
      <img src={course.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setBroken(true)} />
    </div>
  );
}

export function FavoriteButton({ course, className = '' }) {
  const { setFavorite } = useStore();
  const toast = useToast();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await setFavorite(course, !course.favorite);
      toast.success(course.favorite ? 'Removed from favorites.' : 'Saved to favorites.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/95 shadow-soft transition-colors hover:bg-white disabled:opacity-60 ${course.favorite ? 'text-red-600' : 'text-charcoal'} ${className}`}
      aria-pressed={Boolean(course.favorite)}
      aria-label={course.favorite ? `Remove ${course.title} from favorites` : `Save ${course.title} to favorites`}
      disabled={pending}
      onClick={onClick}
    >
      <HeartIcon filled={Boolean(course.favorite)} />
    </button>
  );
}

function CardAction({ course }) {
  const { setInCart } = useStore();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const base = 'relative z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 [&_svg]:h-4 [&_svg]:w-4';

  if (course.enrollment) {
    return <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand [&_svg]:h-4 [&_svg]:w-4"><CheckIcon /> Enrolled</span>;
  }
  if (course.isFree) {
    return <span className="text-sm font-semibold text-brand">{course.local ? 'Open course' : 'Enroll free'}</span>;
  }
  if (course.inCart) {
    return <Link to="/learn/cart" className={`${base} bg-brand-soft text-brand hover:bg-brand-muted/50`}><CartIcon /> In cart</Link>;
  }

  async function onAdd() {
    setPending(true);
    try {
      await setInCart(course, true);
      toast.success(`${course.title} is in your cart.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" className={`${base} border border-brand text-brand hover:bg-brand hover:text-white`} disabled={pending} onClick={onAdd}>
      <CartIcon />
      {pending ? 'Adding…' : 'Add to cart'}
    </button>
  );
}

/** Catalog card for an AilgAdmin course. The title link covers the card; the heart and cart buttons sit above it. */
export function StoreCourseCard({ course }) {
  const duration = formatMinutes(course.totalMinutes);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft transition duration-200 focus-within:shadow-lift hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0">
      <div className="relative">
        <CourseImage course={course} />
        {course.category ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand shadow-soft">{course.category}</span>
        ) : null}
        <FavoriteButton course={course} className="absolute right-3 top-3 z-10" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-charcoal">
          <Link to={`/learn/courses/${course.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none group-hover:text-brand">
            {course.title}
          </Link>
        </h3>
        {course.subtitle ? <p className="mt-1 line-clamp-2 text-sm text-charcoal-muted">{course.subtitle}</p> : null}
        {course.instructorName ? <p className="mt-2 text-xs font-semibold text-charcoal-muted">{course.instructorName}</p> : null}
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal-muted [&_svg]:h-3.5 [&_svg]:w-3.5">
          {course.lessonCount ? <span>{course.lessonCount} lesson{course.lessonCount === 1 ? '' : 's'}</span> : null}
          {duration ? <span className="inline-flex items-center gap-1"><ClockIcon />{duration}</span> : null}
          {course.level ? <span>{statusLabel(course.level)}</span> : null}
        </p>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-2 border-t border-hairline pt-3">
            <span className={`text-lg font-extrabold ${course.isFree ? 'text-brand' : 'text-charcoal'}`}>{formatPrice(course.price, course.currency)}</span>
            <CardAction course={course} />
          </div>
        </div>
      </div>
      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-brand group-has-[:focus-visible]:ring-2" aria-hidden="true" />
    </article>
  );
}

/** Card for a course an administrator added in EduAdmin. Paid ones go through cart; free ones enroll on the course page. */
export function LocalCourseCard({ course }) {
  const duration = formatMinutes(course.totalMinutes);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft transition duration-200 focus-within:shadow-lift hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0">
      <div className="relative">
        <CourseImage course={course} />
        {course.category ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand shadow-soft">{course.category}</span>
        ) : null}
        <FavoriteButton course={course} className="absolute right-3 top-3 z-10" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-charcoal">
          <Link to={`/learn/my-courses/${course.id}`} className="after:absolute after:inset-0 focus-visible:outline-none group-hover:text-brand">
            {course.title}
          </Link>
        </h3>
        {course.subtitle ? <p className="mt-1 line-clamp-2 text-sm text-charcoal-muted">{course.subtitle}</p> : null}
        {course.instructorName ? <p className="mt-2 text-xs font-semibold text-charcoal-muted">{course.instructorName}</p> : null}
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal-muted [&_svg]:h-3.5 [&_svg]:w-3.5">
          {course.lessonCount ? <span>{course.lessonCount} lesson{course.lessonCount === 1 ? '' : 's'}</span> : null}
          {duration ? <span className="inline-flex items-center gap-1"><ClockIcon />{duration}</span> : null}
          {course.level ? <span>{statusLabel(course.level)}</span> : null}
        </p>
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-2 border-t border-hairline pt-3">
            <span className={`text-lg font-extrabold ${course.isFree ? 'text-brand' : 'text-charcoal'}`}>{formatPrice(course.price, course.currency)}</span>
            <CardAction course={course} />
          </div>
        </div>
      </div>
      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-brand group-has-[:focus-visible]:ring-2" aria-hidden="true" />
    </article>
  );
}

export function StoreOutageNotice({ error, onRetry }) {
  return (
    <div role="status" className="mb-6 flex flex-col gap-3 rounded-xl border border-wheat/50 bg-wheat-soft px-4 py-3 text-sm text-wheat-ink sm:flex-row sm:items-center sm:justify-between">
      <p><span className="font-bold">AILG Academy courses could not be loaded.</span> {error?.message || 'The course store did not respond.'} Courses added in EduAdmin are still listed.</p>
      <button type="button" className="btn-outline shrink-0 py-1.5" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function CatalogCard({ course }) {
  return course.local ? <LocalCourseCard course={course} /> : <StoreCourseCard course={course} />;
}

export function Meter({ value, label }) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-hairline"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

const PILL_TONES = {
  active: 'bg-brand-soft text-brand',
  completed: 'bg-emerald-50 text-emerald-800',
  withdrawn: 'bg-sand text-charcoal-muted',
  not_started: 'bg-sand text-charcoal-muted',
  in_progress: 'bg-sky-50 text-sky-900',
};

export function Pill({ status, children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PILL_TONES[status] || 'bg-sand text-charcoal'}`}>
      {children ?? statusLabel(status)}
    </span>
  );
}

function ProgressLine({ enrollment }) {
  if (enrollment.percent == null) {
    return <p className="text-sm text-charcoal-muted">No progress recorded yet</p>;
  }
  return (
    <div className="space-y-1.5">
      <Meter value={enrollment.percent} label={`${enrollment.courseTitle ?? 'Course'} progress`} />
      <p className="flex items-center justify-between text-xs text-charcoal-muted">
        <span className="font-semibold text-charcoal">{enrollment.percent}% complete</span>
        {enrollment.progressStatus ? <span>{statusLabel(enrollment.progressStatus)}</span> : null}
      </p>
    </div>
  );
}

/** Catalog card. The title link stretches over the whole card so it is one tab stop. */
export function CourseCard({ course }) {
  const enrollment = course.enrollment;
  const enrolled = enrollment && enrollment.status !== 'withdrawn';
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-hairline bg-white shadow-soft transition duration-200 focus-within:shadow-lift hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0">
      <CourseCover category={course.categoryName} title={course.title} />
      <div className="flex flex-1 flex-col p-4">
        <p className="eyebrow">{course.categoryName}</p>
        <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-charcoal">
          <Link to={`/learn/my-courses/${course.id}`} className="after:absolute after:inset-0 focus-visible:outline-none group-hover:underline group-hover:decoration-1 group-hover:underline-offset-2">
            {course.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-charcoal-muted">{course.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {enrolled ? <Pill status={enrollment.status}>{enrollment.status === 'completed' ? 'Completed' : 'Enrolled'}</Pill> : <span className="text-xs font-semibold text-charcoal-muted">{enrollment ? 'Withdrawn' : 'Not enrolled'}</span>}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
            View course
            <span className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none [&_svg]:h-4 [&_svg]:w-4"><ArrowRightIcon /></span>
          </span>
        </div>
      </div>
      <span className="pointer-events-none absolute inset-0 rounded-xl ring-brand group-has-[:focus-visible]:ring-2" aria-hidden="true" />
    </article>
  );
}

/** Card for a course the student is enrolled in, led by stored progress. */
export function LearningCard({ enrollment }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-hairline bg-white shadow-soft transition duration-200 focus-within:shadow-lift hover:shadow-lift">
      <CourseCover category={enrollment.categoryName} title={enrollment.courseTitle} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow truncate">{enrollment.categoryName}</p>
            <Pill status={enrollment.status} />
          </div>
          <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-charcoal">
            <Link to={enrollmentLink(enrollment)} className="after:absolute after:inset-0 focus-visible:outline-none group-hover:underline group-hover:decoration-1 group-hover:underline-offset-2">
              {enrollment.courseTitle}
            </Link>
          </h3>
        </div>
        <div className="mt-auto">
          <ProgressLine enrollment={enrollment} />
        </div>
      </div>
      <span className="pointer-events-none absolute inset-0 rounded-xl ring-brand group-has-[:focus-visible]:ring-2" aria-hidden="true" />
    </article>
  );
}

export function SectionHeading({ title, description, action, id }) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 id={id} className="text-xl font-bold tracking-tight text-charcoal sm:text-2xl">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm text-charcoal-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageTitle({ title, description, children }) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-charcoal sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-base text-charcoal-muted">{description}</p> : null}
      </div>
      {children}
    </header>
  );
}

export function StudentEmpty({ title, message, action }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-charcoal">{title}</h2>
      {message ? <p className="mx-auto mt-1.5 max-w-md text-sm text-charcoal-muted">{message}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StudentError({ error, onRetry, title = 'Your learning data could not be loaded' }) {
  return (
    <div className="rounded-xl border border-hairline bg-white px-6 py-12 text-center" role="alert">
      <h2 className="text-lg font-bold text-charcoal">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-charcoal-muted">{error?.message || 'The server did not respond.'}</p>
      {onRetry ? <button type="button" className="btn-outline mt-5" onClick={onRetry}>Try again</button> : null}
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }) {
  return (
    <div className={CARD_GRID} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-hairline bg-white">
          <div className="aspect-[16/9] animate-pulse bg-sand" />
          <div className="space-y-2.5 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-sand" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-sand" />
            <div className="h-3 w-full animate-pulse rounded bg-sand" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ label = 'Loading' }) {
  return (
    <div aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="mb-8 space-y-3 border-b border-hairline pb-6">
        <div className="h-9 w-64 animate-pulse rounded bg-sand" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-sand" />
      </div>
      <CardGridSkeleton count={8} />
    </div>
  );
}

/** Renders loading, error, or the page body from the shared student data. */
export function StudentData({ resource, label, errorTitle, children }) {
  if (resource.status === 'loading' && !resource.data) return <PageSkeleton label={label} />;
  if (resource.status === 'error') return <StudentError error={resource.error} onRetry={resource.reload} title={errorTitle} />;
  return children(resource.data);
}
