import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { statusLabel } from '../lib/format.js';
import { ArrowLeftIcon, ArrowRightIcon, CartIcon, CheckIcon, ClockIcon, HeartIcon } from '../components/icons.jsx';
import { useStore } from './StudentData.jsx';

/** Back control for course detail pages — history when possible, else courses catalog. */
export function CourseBackButton({
  fallback = '/learn/courses',
  label = 'Back to courses',
  className = 'bg-white/15 text-white ring-white/25 hover:bg-white/25',
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 backdrop-blur [&_svg]:h-4 [&_svg]:w-4 ${className}`}
      onClick={() => {
        if (window.history.length > 1) navigate(-1);
        else navigate(fallback);
      }}
    >
      <ArrowLeftIcon />
      {label}
    </button>
  );
}

/** “This course includes” list from admin/API includes field. */
export function CourseIncludes({ items, tone = 'light' }) {
  if (!items?.length) return null;
  const wrap = tone === 'dark'
    ? 'rounded-xl bg-white/10 p-4 text-white ring-1 ring-white/15'
    : 'rounded-2xl border border-hairline bg-white p-5';
  const title = tone === 'dark' ? 'text-sm font-bold uppercase tracking-wide text-white/80' : 'text-sm font-bold uppercase tracking-wide text-charcoal-muted';
  const row = tone === 'dark' ? 'text-sm text-white/90' : 'text-sm text-charcoal';
  return (
    <div className={wrap}>
      <p className={title}>This course includes</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className={`flex gap-2.5 [&_svg]:mt-0.5 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-brand ${row}`}>
            <CheckIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const CARD_GRID = 'grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

const COVER_PHOTOS = [
  '/covers/servers.jpg',
  '/covers/coding.jpg',
  '/covers/data.jpg',
  '/covers/cloud.jpg',
  '/covers/math.jpg',
  '/covers/design.jpg',
];

const COVER_TONES = [
  { bg: '#e4eee6', line: '#7fa58b' },
  { bg: '#fbf3d6', line: '#c9a53c' },
  { bg: '#e9efe1', line: '#98ad7a' },
  { bg: '#f3ece0', line: '#b89e78' },
  { bg: '#dfebe7', line: '#6f9c90' },
  { bg: '#f6f0dc', line: '#b8a160' },
];

function hashKey(key) {
  let hash = 0;
  for (const char of String(key || '')) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

function toneFor(key) {
  return COVER_TONES[hashKey(key) % COVER_TONES.length];
}

function coverPhotoFor(category, title) {
  const text = `${category || ''} ${title || ''}`.toLowerCase();
  if (/database|server|sql|postgres|data\b|infra/.test(text)) return '/covers/servers.jpg';
  if (/react|web|stack|front|software|code|program/.test(text)) return '/covers/coding.jpg';
  if (/math|stat|probab|calculus|algebra/.test(text)) return '/covers/math.jpg';
  if (/design|ui|ux|interface|human/.test(text)) return '/covers/design.jpg';
  if (/cloud|kubernetes|devops|distribut/.test(text)) return '/covers/cloud.jpg';
  if (/machine|ai|analytics|ml\b|engineer/.test(text)) return '/covers/data.jpg';
  return COVER_PHOTOS[hashKey(title || category) % COVER_PHOTOS.length];
}

/** Photo cover for courses without an uploaded image (category-aware stock art). */
export function CourseCover({ category, title, className = '' }) {
  const [broken, setBroken] = useState(false);
  const tone = toneFor(category || title);
  const src = coverPhotoFor(category, title);
  const initial = String(title || category || '').trim().charAt(0).toUpperCase();

  if (broken) {
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

  return (
    <div className={`relative aspect-[16/9] overflow-hidden bg-sand ${className}`} aria-hidden="true">
      <img
        src={src}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setBroken(true)}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand/45 via-brand/10 to-mint-soft/20" />
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

/** Module count for catalog cards (Ailg-style “N modules”). */
function moduleCountFor(course) {
  if (Array.isArray(course.modules) && course.modules.length) return course.modules.length;
  if (Array.isArray(course.sections) && course.sections.length) return course.sections.length;
  if (course.lessonCount) return course.lessonCount;
  return null;
}

/** Ailg-style card footer: Details | Buy Now (or Coming Soon / Enrolled). */
function CourseCardActions({ course, detailTo, learnTo }) {
  const detailClass = 'flex items-center justify-center gap-1.5 rounded-2xl border border-hairline bg-white py-2.5 text-sm font-bold text-brand shadow-soft transition hover:border-brand/40 hover:scale-[1.02] active:scale-95';
  const buyClass = 'flex items-center justify-center gap-1.5 rounded-2xl bg-brand py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-brand-hover hover:scale-[1.02] active:scale-95';
  const soonClass = 'flex items-center justify-center gap-1.5 rounded-2xl bg-sand py-2.5 text-sm font-bold text-charcoal-muted';

  if (course.isComingSoon) {
    return (
      <div className="relative z-10 grid grid-cols-2 gap-2">
        <Link to={detailTo} className={detailClass}>Details</Link>
        <span className={soonClass} aria-disabled="true">Coming Soon</span>
      </div>
    );
  }

  if (course.enrollment) {
    return (
      <div className="relative z-10 grid grid-cols-2 gap-2">
        <Link to={detailTo} className={detailClass}>Details</Link>
        <Link to={learnTo} className={buyClass}>Continue</Link>
      </div>
    );
  }

  return (
    <div className="relative z-10 grid grid-cols-2 gap-2">
      <Link to={detailTo} className={detailClass}>Details</Link>
      <Link to={`${detailTo}?buy=1`} className={buyClass}>
        <CartIcon />
        {course.isFree ? (course.local ? 'Open' : 'Enroll') : 'Buy Now'}
      </Link>
    </div>
  );
}

/** Catalog card for an AilgAdmin course. */
export function StoreCourseCard({ course }) {
  const duration = formatMinutes(course.totalMinutes);
  const detailTo = `/learn/courses/${course.slug}`;
  const learnTo = `/learn/courses/${course.slug}/learn`;
  const modules = moduleCountFor(course);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft transition duration-200 focus-within:shadow-lift hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0">
      <div className="relative">
        <Link to={detailTo} tabIndex={-1} aria-hidden="true">
          <CourseImage course={course} />
        </Link>
        {course.category ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand shadow-soft">{course.category}</span>
        ) : null}
        {course.badge ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-brand/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-soft">{course.badge}</span>
        ) : null}
        <FavoriteButton course={course} className="absolute right-3 top-3 z-10" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-charcoal">
          <Link to={detailTo} className="hover:text-brand focus-visible:outline-none">
            {course.title}
          </Link>
        </h3>
        {(course.description || course.subtitle) ? (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-charcoal-muted">
            {course.description || course.subtitle}
          </p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          {modules != null ? (
            <span className="font-medium text-wheat-ink">{modules} module{modules === 1 ? '' : 's'}</span>
          ) : (
            <span className="text-charcoal-muted">
              {duration ? <span className="inline-flex items-center gap-1"><ClockIcon />{duration}</span> : null}
            </span>
          )}
          <span className={`text-lg font-bold ${course.isFree ? 'text-brand' : 'text-brand'}`}>{formatPrice(course.price, course.currency)}</span>
        </div>
        <div className="mt-auto pt-4">
          <CourseCardActions course={course} detailTo={detailTo} learnTo={learnTo} />
        </div>
      </div>
    </article>
  );
}

/** Card for a course an administrator added in EduAdmin. */
export function LocalCourseCard({ course }) {
  const duration = formatMinutes(course.totalMinutes);
  const detailTo = `/learn/my-courses/${course.id}`;
  const learnTo = `/learn/my-courses/${course.id}/learn`;
  const modules = moduleCountFor(course);
  const comingSoon = Boolean(course.isComingSoon);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft transition duration-200 focus-within:shadow-lift hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0">
      <div className="relative">
        <Link to={detailTo} tabIndex={-1} aria-hidden="true">
          <div className={comingSoon ? '[&_img]:grayscale-[60%]' : undefined}>
            <CourseImage course={course} />
          </div>
        </Link>
        {course.category ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand shadow-soft">{course.category}</span>
        ) : null}
        {comingSoon ? (
          <span className="absolute right-3 top-3 rounded-full bg-wheat px-3 py-1.5 text-sm font-bold text-charcoal shadow-soft">Coming Soon</span>
        ) : (
          <FavoriteButton course={course} className="absolute right-3 top-3 z-10" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-charcoal">
          <Link to={detailTo} className="hover:text-brand focus-visible:outline-none">
            {course.title}
          </Link>
        </h3>
        {(course.description || course.subtitle) ? (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-charcoal-muted">
            {course.description || course.subtitle}
          </p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-2 text-sm">
          {modules != null ? (
            <span className="font-medium text-wheat-ink">{modules} module{modules === 1 ? '' : 's'}</span>
          ) : (
            <span className="text-charcoal-muted">
              {duration ? <span className="inline-flex items-center gap-1"><ClockIcon />{duration}</span> : null}
            </span>
          )}
          <span className="text-lg font-bold text-brand">
            {comingSoon ? 'Coming Soon' : formatPrice(course.price, course.currency)}
          </span>
        </div>
        <div className="mt-auto pt-4">
          <CourseCardActions course={course} detailTo={detailTo} learnTo={learnTo} />
        </div>
      </div>
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
