import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, ClockIcon } from '../components/icons.jsx';
import { CourseBackButton, CourseCover, formatPrice } from './components.jsx';

/** Normalize catalog / local course shapes into Ailg-style program fields. */
export function normalizeProgram(course) {
  const category = course.category || course.categoryName || null;
  const modules = Array.isArray(course.modules) && course.modules.length
    ? course.modules.map((item) => (typeof item === 'string' ? { title: item } : { title: item?.title || 'Module' }))
    : (course.sections || []).map((section) => ({ title: section.title || 'Module' }));

  let materials = [];
  if (Array.isArray(course.materials) && course.materials.length) {
    materials = course.materials.map((item, index) => ({
      id: item.id ?? `mat-${index}`,
      kind: item.kind || item.type || 'document',
      title: item.title || 'Material',
      duration: item.duration || (item.durationMinutes ? `~${item.durationMinutes} min` : null),
      fileMeta: item.fileMeta || null,
    }));
  } else if (Array.isArray(course.includes) && course.includes.length) {
    materials = course.includes.map((title, index) => ({
      id: `inc-${index}`,
      kind: 'document',
      title,
      duration: null,
      fileMeta: null,
    }));
  } else {
    const lessons = (course.sections || []).flatMap((section) => section.lessons || []);
    materials = lessons.slice(0, 12).map((lesson, index) => ({
      id: lesson.id ?? `les-${index}`,
      kind: lesson.type === 'video' || lesson.videoUrl ? 'video' : lesson.type === 'pdf' || lesson.pdfUrl ? 'file' : 'document',
      title: lesson.title || 'Lesson',
      duration: lesson.durationMinutes ? `~${lesson.durationMinutes} min` : null,
      fileMeta: null,
    }));
  }

  const audience = Array.isArray(course.audience) && course.audience.length
    ? course.audience
    : (course.requirements || []);

  return {
    category,
    modules,
    materials,
    audience,
    isActive: !course.isComingSoon
      && course.status !== 'coming_soon'
      && course.is_active !== false
      && course.published !== false,
  };
}

function MaterialGlyph({ kind }) {
  const label = kind === 'video' ? 'Video' : kind === 'file' ? 'File' : 'Reading';
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-wheat/40 text-[10px] font-bold uppercase tracking-wide text-brand"
      aria-hidden="true"
    >
      {label.slice(0, 3)}
    </span>
  );
}

/** Udemy-style preview media for the sticky purchase card (not a full-width top hero). */
export function SidebarPreview({ course, category, previewLabel = 'Preview this course' }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden bg-charcoal">
      {!course.imageUrl || broken ? (
        <CourseCover category={category} title={course.title} className="!aspect-auto h-full" />
      ) : (
        <img
          src={course.imageUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-sm font-bold text-charcoal shadow-soft">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-white" aria-hidden="true">▶</span>
          {previewLabel}
        </span>
      </div>
    </div>
  );
}

/**
 * Udemy-like lead: dark text band (no top banner image).
 * Image lives in the sticky sidebar instead.
 */
export function ProgramLead({ course, category, isActive, badge = null }) {
  const crumbs = [
    { label: 'Courses', to: '/learn/courses' },
    category ? { label: category, to: `/learn/courses?category=${encodeURIComponent(category)}` } : null,
  ].filter(Boolean);

  const meta = [
    course.instructorName ? `Created by ${course.instructorName}` : null,
    course.level ? course.level : null,
    course.language || null,
    isActive ? 'Active' : null,
  ].filter(Boolean);

  return (
    <section className="-mx-4 bg-charcoal px-4 py-8 text-white sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-2xl lg:px-8">
      <CourseBackButton
        className="!rounded-none !bg-transparent !px-0 !py-0 !font-bold !text-white/90 !shadow-none !ring-0 hover:!bg-transparent hover:!text-white"
      />
      <nav aria-label="Breadcrumb" className="mt-4 text-sm text-white/65">
        <ol className="flex flex-wrap items-center gap-1.5">
          {crumbs.map((crumb, index) => (
            <li key={crumb.to} className="flex items-center gap-1.5">
              {index > 0 ? <span aria-hidden="true">›</span> : null}
              <Link to={crumb.to} className="font-semibold text-white/85 hover:text-white hover:underline">
                {crumb.label}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {category ? (
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
            {category}
          </span>
        ) : null}
        {badge ? (
          <span className="rounded-full bg-wheat px-3 py-1 text-xs font-bold uppercase tracking-widest text-charcoal">
            {badge}
          </span>
        ) : null}
      </div>
      <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight lg:text-4xl">{course.title}</h1>
      {(course.subtitle && course.subtitle !== course.description) ? (
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-white/85">{course.subtitle}</p>
      ) : course.description ? (
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/80 line-clamp-3">{course.description}</p>
      ) : null}
      {meta.length ? (
        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/75">
          {meta.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : null}
    </section>
  );
}

export function ProgramCard({ id, title, badge, children }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-hairline bg-white p-6 lg:p-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 id={id} className="text-xl font-bold tracking-tight text-charcoal sm:text-2xl">{title}</h2>
        {badge ? <span className="shrink-0 rounded-full bg-mint-soft px-3 py-1 text-xs font-bold text-brand">{badge}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function ProgramOutcomes({ items }) {
  if (!items?.length) return null;
  return (
    <ProgramCard id="outcomes-title" title="What you’ll learn">
      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-charcoal [&_svg]:mt-0.5 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0 [&_svg]:text-brand">
            <CheckIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </ProgramCard>
  );
}

export function ProgramModules({ modules }) {
  if (!modules?.length) return null;
  return (
    <ProgramCard id="modules-title" title="Program modules" badge={`${modules.length} module${modules.length === 1 ? '' : 's'}`}>
      <div className="space-y-3">
        {modules.map((module, index) => (
          <div key={`${module.title}-${index}`} className="flex items-center gap-4 rounded-lg border border-hairline bg-canvas/80 p-4">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
              {index + 1}
            </div>
            <span className="text-charcoal">{module.title}</span>
          </div>
        ))}
      </div>
    </ProgramCard>
  );
}

export function ProgramMaterials({ materials }) {
  if (!materials?.length) return null;
  return (
    <ProgramCard id="materials-title" title="What’s included" badge={`${materials.length} item${materials.length === 1 ? '' : 's'}`}>
      <div className="space-y-3">
        {materials.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-lg border border-hairline p-3">
            <MaterialGlyph kind={item.kind} />
            <div className="min-w-0">
              <p className="font-medium text-charcoal">{item.title}</p>
              {item.duration ? <p className="text-sm text-charcoal-muted">{item.duration}</p> : null}
              {item.fileMeta ? <p className="text-xs text-charcoal-muted">{item.fileMeta}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </ProgramCard>
  );
}

/** Removed from UI; kept as a no-op so stale HMR bundles don't crash. */
export function ProgramProcess() {
  return null;
}

export function ProgramAudience({ items }) {
  if (!items?.length) return null;
  return (
    <ProgramCard id="audience-title" title="Who this program is for">
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 rounded-lg border border-hairline bg-canvas/80 p-3 text-sm leading-relaxed text-charcoal">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand/15 text-[10px] font-bold text-brand" aria-hidden="true">
              ·
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </ProgramCard>
  );
}

export function ProgramOverviewMeta({ category, moduleCount, materialCount }) {
  const rows = [
    category ? { key: 'cat', label: category } : null,
    moduleCount ? { key: 'mod', label: `${moduleCount} module${moduleCount === 1 ? '' : 's'}` } : null,
    materialCount ? { key: 'mat', label: `${materialCount} material${materialCount === 1 ? '' : 's'}` } : null,
    { key: 'life', label: 'Lifetime access', icon: true },
  ].filter(Boolean);

  return (
    <ul className="mt-6 space-y-3 border-t border-hairline pt-6 text-sm text-charcoal">
      {rows.map((row) => (
        <li key={row.key} className="flex items-center gap-2.5 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-brand">
          {row.icon ? <ClockIcon /> : <CheckIcon />}
          <span>{row.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProgramDetailChrome({ course, category, children, related, relatedTitle }) {
  const priceLabel = formatPrice(course.price, course.currency || 'ETB');
  const program = normalizeProgram(course);

  return (
    <div className="space-y-6">
      <ProgramLead
        course={course}
        category={category}
        isActive={program.isActive}
        badge={course.badge || null}
      />

      {children({ program, priceLabel })}

      {related?.length ? (
        <section aria-labelledby="related-title" className="pt-6">
          <h2 id="related-title" className="mb-5 text-xl font-bold tracking-tight text-charcoal sm:text-2xl">
            {relatedTitle || 'More courses'}
          </h2>
          {related}
        </section>
      ) : null}
    </div>
  );
}
