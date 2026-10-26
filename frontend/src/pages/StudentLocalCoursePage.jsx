import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, statusLabel } from '../lib/format.js';
import { CartIcon, CheckIcon, HeartIcon, PlayIcon } from '../components/icons.jsx';
import { courseIndex, useAllCourses, useDocumentTitle, useStore, useStudentData } from '../student/StudentData.jsx';
import { VideoPlayer } from '../student/VideoPlayer.jsx';
import {
  CARD_GRID,
  CatalogCard,
  Meter,
  PageSkeleton,
  Pill,
  StudentData,
  StudentEmpty,
  formatMinutes,
  formatPrice,
} from '../student/components.jsx';
import {
  ProgramAudience,
  ProgramCard,
  ProgramDetailChrome,
  ProgramMaterials,
  ProgramModules,
  ProgramOutcomes,
  ProgramOverviewMeta,
  SidebarPreview,
} from '../student/programDetail.jsx';

function ActionCard({ course, program }) {
  const { enroll, refresh } = useStudentData();
  const { cart, setInCart, setFavorite, checkout } = useStore();
  const toast = useToast();
  const [pending, setPending] = useState(null);
  const enrollment = course.enrollment;
  const enrolled = enrollment && enrollment.status !== 'withdrawn';
  const price = Number(course.price) || 0;
  const isFree = price <= 0;
  const currency = course.currency || 'ETB';
  const storeCourse = {
    local: true,
    id: course.id,
    courseId: course.id,
    title: course.title,
    favorite: Boolean(course.favorite),
    inCart: Boolean(course.inCart),
    price,
    currency,
    isFree,
  };

  async function run(kind, action, message) {
    setPending(kind);
    try {
      await action();
      await refresh();
      if (message) toast.success(message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-lift lg:sticky lg:top-24">
      <SidebarPreview course={course} category={program.category} />
      <div className="p-5 lg:p-6">
      {enrolled ? (
        <div className="mt-5 space-y-4">
          <p className="flex items-center gap-2 text-lg font-bold text-brand [&_svg]:h-5 [&_svg]:w-5">
            <CheckIcon />
            {enrollment.status === 'completed' ? 'You completed this course' : 'You are enrolled'}
          </p>
          {enrollment.percent == null ? (
            <p className="text-sm text-charcoal-muted">No progress recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              <Meter value={enrollment.percent} label="Course progress" />
              <p className="flex justify-between text-sm">
                <span className="font-semibold">{enrollment.percent}% complete</span>
                {enrollment.progressStatus ? <span className="text-charcoal-muted">{statusLabel(enrollment.progressStatus)}</span> : null}
              </p>
            </div>
          )}
          <Link to={`/learn/my-courses/${course.id}/learn`} className="btn-brand w-full py-3.5 text-base">
            {enrollment.status === 'completed' ? 'Go to course' : enrollment.percent > 0 ? 'Go to course' : 'Start learning'}
          </Link>
          <Link to="/learn/my-learning" className="btn-outline w-full py-3 text-base">Go to My learning</Link>
        </div>
      ) : course.isComingSoon || course.status === 'coming_soon' ? (
        <>
          <p className="mt-5 text-3xl font-extrabold text-brand">Coming Soon</p>
          <p className="mt-1 text-xs text-charcoal-muted">This livestock program is not open for enrollment yet.</p>
          <ProgramOverviewMeta
            category={program.category}
            moduleCount={program.modules.length}
            materialCount={program.materials.length}
          />
          <button type="button" className="btn mt-6 w-full cursor-not-allowed border border-hairline bg-sand py-4 text-base text-charcoal-muted" disabled>
            Coming Soon
          </button>
        </>
      ) : course.published !== false ? (
        <>
          <p className="mt-5 text-3xl font-extrabold text-brand">{formatPrice(price, currency)}</p>
          <p className="mt-1 text-xs text-charcoal-muted">One-time payment</p>
          <ProgramOverviewMeta
            category={program.category}
            moduleCount={program.modules.length}
            materialCount={program.materials.length}
          />
          <div className="mt-6 space-y-3 border-t border-hairline pt-6">
            {isFree ? (
              <button type="button" className="btn-brand w-full py-4 text-base" disabled={Boolean(pending)} onClick={() => run('enroll', () => enroll(course.id), `Enrolled in ${course.title}. It is now in My learning.`)}>
                {pending === 'enroll' ? 'Enrolling…' : enrollment ? 'Enroll again' : 'Enroll for free'}
              </button>
            ) : (
              <>
                {course.inCart ? (
                  <Link to="/learn/cart" className="btn-brand flex w-full items-center justify-center gap-2 py-4 text-base [&_svg]:h-5 [&_svg]:w-5"><CartIcon /> Go to cart</Link>
                ) : (
                  <button type="button" className="btn-outline flex w-full items-center justify-center gap-2 py-3.5 text-base [&_svg]:h-5 [&_svg]:w-5" disabled={Boolean(pending)} onClick={() => run('cart', () => setInCart(storeCourse, true), 'Added to your cart. Open Cart to pay.')}>
                    <CartIcon />
                    {pending === 'cart' ? 'Adding…' : 'Add to cart'}
                  </button>
                )}
                <button type="button" className="btn-brand flex w-full items-center justify-center gap-2 py-4 text-base [&_svg]:h-5 [&_svg]:w-5" disabled={Boolean(pending) || !cart.paymentsEnabled} onClick={() => run('pay', () => checkout([storeCourse]))}>
                  <CartIcon />
                  {pending === 'pay' ? 'Opening Chapa…' : 'Buy Now'}
                </button>
                <p className="text-center text-xs text-charcoal-muted">
                  {cart.paymentsEnabled ? 'Secure payment via Chapa' : 'Online payment is not set up yet.'}
                </p>
              </>
            )}
          </div>
        </>
      ) : (
        <p className="mt-5 text-sm text-charcoal-muted">This course is no longer published, so it cannot be joined again.</p>
      )}
      <button
        type="button"
        className={`btn mt-4 w-full border px-4 py-2.5 [&_svg]:h-4 [&_svg]:w-4 ${course.favorite ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'border-hairline bg-white text-charcoal hover:bg-sand'}`}
        aria-pressed={Boolean(course.favorite)}
        disabled={Boolean(pending)}
        onClick={() => run('favorite', () => setFavorite(storeCourse, !course.favorite), course.favorite ? 'Removed from favorites.' : 'Saved for later.')}
      >
        <HeartIcon filled={Boolean(course.favorite)} />
        {course.favorite ? 'Saved for later' : 'Save for later'}
      </button>
      </div>
    </div>
  );
}

function Outline({ sections }) {
  if (!sections?.length) return null;
  const hasLessons = sections.some((section) => section.lessons?.length);
  if (!hasLessons) return null;
  const lessonCount = sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const total = formatMinutes(sections.reduce((sum, section) => sum + section.lessons.reduce((acc, lesson) => acc + (lesson.durationMinutes || 0), 0), 0));
  return (
    <ProgramCard
      id="outline-title"
      title="Course content"
      badge={`${sections.length} section${sections.length === 1 ? '' : 's'} · ${lessonCount} lesson${lessonCount === 1 ? '' : 's'}${total ? ` · ${total}` : ''}`}
    >
      <div className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
        {sections.map((section, sectionIndex) => (
          <details key={`${section.title}-${sectionIndex}`} open={sectionIndex === 0} className="group/section">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-canvas/80 px-5 py-3.5 font-bold text-charcoal hover:bg-sand [&::-webkit-details-marker]:hidden">
              <span>{section.title}</span>
              <span className="shrink-0 text-xs font-semibold text-charcoal-muted">
                {section.lessons.length} lesson{section.lessons.length === 1 ? '' : 's'}
                <span className="ml-2 inline-block transition-transform group-open/section:rotate-180" aria-hidden="true">▾</span>
              </span>
            </summary>
            <ul className="divide-y divide-hairline bg-white">
              {section.lessons.map((lesson, lessonIndex) => (
                <li key={`${sectionIndex}-${lessonIndex}`} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4"><PlayIcon /></span>
                  <span className="min-w-0 flex-1 text-charcoal">{lesson.title}</span>
                  <span className="w-20 shrink-0 text-right text-xs text-charcoal-muted">
                    {lesson.durationMinutes ? formatMinutes(lesson.durationMinutes) : statusLabel(lesson.type || 'lesson')}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </ProgramCard>
  );
}

function DetailBody({ data, courseId }) {
  const index = courseIndex(data);
  const course = index.get(courseId);
  const { courses } = useAllCourses();
  useDocumentTitle(course?.title ?? 'Course not found');

  if (!course) {
    return (
      <StudentEmpty
        title="Course not found"
        message="This course is not published and is not on your learning record."
        action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
      />
    );
  }

  const related = courses
    .filter((item) => item.local && item.id !== course.id && item.category === course.categoryName)
    .slice(0, 4);

  return (
    <ProgramDetailChrome
      course={course}
      category={course.categoryName}
      relatedTitle={course.categoryName ? `More in ${course.categoryName}` : 'More courses'}
      related={related.length ? (
        <ul className={CARD_GRID}>
          {related.map((item) => <li key={item.key}><CatalogCard course={item} /></li>)}
        </ul>
      ) : null}
    >
      {({ program }) => (
        <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
          <div className="space-y-6 lg:col-span-2">
            <ProgramOutcomes items={course.outcomes} />

            {course.description ? (
              <ProgramCard id="about-title" title="About this course">
                <p className="whitespace-pre-line leading-relaxed text-charcoal">{course.description}</p>
              </ProgramCard>
            ) : null}

            {course.previewVideoUrl ? (
              <ProgramCard id="preview-title" title="Course preview">
                <div className="overflow-hidden rounded-xl bg-charcoal">
                  <VideoPlayer url={course.previewVideoUrl} title={`${course.title} preview`} />
                </div>
              </ProgramCard>
            ) : null}

            <ProgramModules modules={program.modules} />
            <ProgramMaterials materials={program.materials} />
            <Outline sections={course.sections} />
            <ProgramAudience items={program.audience} />

            {course.enrollment && course.enrollment.status !== 'withdrawn' ? (
              <ProgramCard id="record-title" title="Your learning record">
                <dl className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'Enrollment', value: <Pill status={course.enrollment.status} /> },
                    { label: 'Progress', value: course.enrollment.percent == null ? 'Not recorded' : `${course.enrollment.percent}%` },
                    { label: 'Enrolled on', value: formatDate(course.enrollment.enrolledAt) },
                  ].map((row) => (
                    <div key={row.label}>
                      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-muted">{row.label}</dt>
                      <dd className="mt-1 text-sm font-semibold text-charcoal">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </ProgramCard>
            ) : null}
          </div>

          <aside className="lg:col-span-1" aria-label="Enroll in this course">
            <ActionCard course={course} program={program} />
          </aside>
        </div>
      )}
    </ProgramDetailChrome>
  );
}

export function StudentLocalCoursePage() {
  const { courseId } = useParams();
  const resource = useStudentData();
  const refresh = useRef(resource.refresh);
  useEffect(() => {
    refresh.current();
  }, [courseId]);

  if (resource.status === 'loading' && !resource.data) return <PageSkeleton label="Loading course" />;

  return (
    <StudentData resource={resource} label="Loading course">
      {(data) => <DetailBody data={data} courseId={Number(courseId)} />}
    </StudentData>
  );
}
