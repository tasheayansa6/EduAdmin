import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, ClockIcon } from '../components/icons.jsx';
import { CourseBackButton, CourseCover, formatPrice } from './components.jsx';

/** Default “How it works” steps matching the AilgAgro program detail pattern. */
export const DEFAULT_PROCESS = [
  {
    step: 1,
    title: 'Enroll once',
    description: 'Pay the one-time tuition and unlock the full program in your account—no hidden modules or surprise fees.',
  },
  {
    step: 2,
    title: 'Learn your way',
    description: 'Watch the video lesson, read the on-page guides, and download the PDFs when you need them offline.',
  },
  {
    step: 3,
    title: 'Apply with your team',
    description: 'Use the module outline to run short sessions with your board or fattening group; materials are written to be shared.',
  },
];

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

  const process = Array.isArray(course.process) && course.process.length
    ? course.process.map((item, index) => ({
      step: item.step ?? index + 1,
      title: item.title || `Step ${index + 1}`,
      description: item.description || '',
    }))
    : DEFAULT_PROCESS;

  return {
    category,
    modules,
    materials,
    audience,
    process,
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

function HeroMedia({ course, category }) {
  const [broken, setBroken] = useState(false);
  if (!course.imageUrl || broken) {
    return <CourseCover category={category} title={course.title} className="!aspect-auto h-full min-h-[16rem]" />;
  }
  return (
    <img
      src={course.imageUrl}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

export function ProgramHero({ course, category, priceLabel, isActive, badge = null }) {
  return (
    <div className="relative mt-2 overflow-hidden rounded-3xl bg-charcoal shadow-soft">
      <div className="relative h-64 lg:h-96">
        <HeroMedia course={course} category={category} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" aria-hidden="true" />
        {priceLabel ? (
          <div className="absolute left-4 top-4 rounded-xl bg-[#43AA5C] px-4 py-2 text-lg font-bold text-white shadow-lg">
            {priceLabel}
          </div>
        ) : null}
        {isActive ? (
          <div className="absolute right-4 top-4 rounded-full bg-[#43AA5C] px-3 py-1.5 text-sm font-medium text-white">
            Active
          </div>
        ) : null}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex flex-wrap items-center gap-2">
            {category ? (
              <span className="inline-block rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-brand backdrop-blur">
                {category}
              </span>
            ) : null}
            {badge ? (
              <span className="inline-block rounded-full bg-brand/90 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur">
                {badge}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white lg:text-4xl">{course.title}</h1>
          {course.subtitle ? <p className="mt-2 max-w-3xl text-base text-white/85 lg:text-lg">{course.subtitle}</p> : null}
        </div>
      </div>
    </div>
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

export function ProgramProcess({ steps }) {
  if (!steps?.length) return null;
  return (
    <ProgramCard id="process-title" title="How it works">
      <ol className="mt-1">
        {steps.map((step, index) => (
          <li key={step.step ?? index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                {step.step ?? index + 1}
              </span>
              {index < steps.length - 1 ? <span className="my-1 w-px flex-1 bg-hairline" aria-hidden="true" /> : null}
            </div>
            <div className={index < steps.length - 1 ? 'pb-6' : ''}>
              <h3 className="font-bold text-charcoal">{step.title}</h3>
              {step.description ? <p className="mt-1 text-sm leading-relaxed text-charcoal-muted">{step.description}</p> : null}
            </div>
          </li>
        ))}
      </ol>
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
      {/* Matches AilgAgro /program/:id — text back link only */}
      <CourseBackButton
        className="!rounded-none !bg-transparent !px-0 !py-0 !font-bold !text-brand !shadow-none !ring-0 hover:!bg-transparent hover:!text-brand-hover"
      />

      <ProgramHero
        course={course}
        category={category}
        priceLabel={priceLabel}
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
