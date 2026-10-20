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
  CourseCover,
  CourseImage,
  Meter,
  PageSkeleton,
  Pill,
  SectionHeading,
  StudentData,
  StudentEmpty,
  formatMinutes,
  formatPrice,
} from '../student/components.jsx';

function ActionCard({ course }) {
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
    <div className="s-card overflow-hidden lg:sticky lg:top-24">
      {course.imageUrl ? <CourseImage course={course} /> : <CourseCover category={course.categoryName} title={course.title} />}
      <div className="space-y-4 p-5">
        {enrolled ? (
          <>
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
            <Link to="/learn/my-learning" className="btn-brand w-full py-3 text-base">Go to My learning</Link>
          </>
        ) : course.published ? (
          <>
            <p className="text-3xl font-extrabold tracking-tight text-charcoal">{formatPrice(price, currency)}</p>
            {isFree ? (
              <button type="button" className="btn-brand w-full py-3 text-base" disabled={Boolean(pending)} onClick={() => run('enroll', () => enroll(course.id), `Enrolled in ${course.title}. It is now in My learning.`)}>
                {pending === 'enroll' ? 'Enrolling…' : enrollment ? 'Enroll again' : 'Enroll for free'}
              </button>
            ) : (
              <>
                {course.inCart ? (
                  <Link to="/learn/cart" className="btn-brand w-full py-3 text-base [&_svg]:h-4 [&_svg]:w-4"><CartIcon /> Go to cart</Link>
                ) : (
                  <button type="button" className="btn-brand w-full py-3 text-base [&_svg]:h-4 [&_svg]:w-4" disabled={Boolean(pending)} onClick={() => run('cart', () => setInCart(storeCourse, true), 'Added to your cart. Open Cart to pay.')}>
                    <CartIcon />
                    {pending === 'cart' ? 'Adding…' : 'Add to cart'}
                  </button>
                )}
                <button type="button" className="btn-wheat w-full py-3 text-base" disabled={Boolean(pending) || !cart.paymentsEnabled} onClick={() => run('pay', () => checkout([storeCourse]))}>
                  {pending === 'pay' ? 'Opening Chapa…' : 'Buy now'}
                </button>
                {course.favorite && !course.inCart ? (
                  <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">
                    Saved for later.{' '}
                    <button type="button" className="font-bold underline underline-offset-2" disabled={Boolean(pending)} onClick={() => run('cart', () => setInCart(storeCourse, true), 'Added to your cart.')}>
                      Add to cart
                    </button>
                  </p>
                ) : null}
              </>
            )}
            {course.includes?.length ? (
              <ul className="space-y-2 border-t border-hairline pt-4 text-sm text-charcoal">
                {course.includes.map((item) => (
                  <li key={item} className="flex gap-2 [&_svg]:mt-0.5 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-brand">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-charcoal-muted">This course is no longer published, so it cannot be joined again.</p>
        )}
        <button
          type="button"
          className={`btn w-full border px-4 py-2.5 [&_svg]:h-4 [&_svg]:w-4 ${course.favorite ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'border-hairline bg-white text-charcoal hover:bg-sand'}`}
          aria-pressed={Boolean(course.favorite)}
          disabled={Boolean(pending)}
          onClick={() => run('favorite', () => setFavorite(storeCourse, !course.favorite), course.favorite ? 'Removed from favorites.' : 'Saved for later. You can add it to your cart when you are ready.')}
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
  const lessonCount = sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const total = formatMinutes(sections.reduce((sum, section) => sum + section.lessons.reduce((acc, lesson) => acc + (lesson.durationMinutes || 0), 0), 0));
  return (
    <section aria-labelledby="outline-title">
      <SectionHeading
        id="outline-title"
        title="Course content"
        description={`${sections.length} section${sections.length === 1 ? '' : 's'} · ${lessonCount} lesson${lessonCount === 1 ? '' : 's'}${total ? ` · ${total} total` : ''}`}
      />
      <div className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-white">
        {sections.map((section, sectionIndex) => (
          <details key={`${section.title}-${sectionIndex}`} open={sectionIndex === 0} className="group/section">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-sand/60 px-5 py-3.5 font-bold text-charcoal hover:bg-sand [&::-webkit-details-marker]:hidden">
              <span>{section.title}</span>
              <span className="shrink-0 text-xs font-semibold text-charcoal-muted">
                {section.lessons.length} lesson{section.lessons.length === 1 ? '' : 's'}
                <span className="ml-2 inline-block transition-transform group-open/section:rotate-180" aria-hidden="true">▾</span>
              </span>
            </summary>
            <ul className="divide-y divide-hairline">
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
    </section>
  );
}

function ListSection({ id, title, items, columns = false }) {
  if (!items?.length) return null;
  return (
    <section aria-labelledby={id}>
      <SectionHeading id={id} title={title} />
      <ul className={`grid gap-3 ${columns ? 'sm:grid-cols-2' : ''}`}>
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-charcoal [&_svg]:mt-0.5 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-brand">
            <CheckIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
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
        message="This course is not in the published catalog and is not on your learning record."
        action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
      />
    );
  }

  const related = courses
    .filter((item) => item.local && item.id !== course.id && item.category === course.categoryName)
    .slice(0, 4);
  const duration = formatMinutes(course.totalMinutes);
  const meta = [
    course.instructorName ? `By ${course.instructorName}` : null,
    course.level ? statusLabel(course.level) : null,
    course.language || null,
    course.sections?.length
      ? `${course.sections.reduce((sum, section) => sum + section.lessons.length, 0)} lessons`
      : null,
    duration,
    course.updatedAt ? `Updated ${formatDate(course.updatedAt)}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-brand text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-wheat/15" aria-hidden="true" />
        <div className="relative p-6 sm:p-8 lg:p-10">
          <nav aria-label="Breadcrumb" className="text-sm">
            <ol className="flex flex-wrap items-center gap-1.5 text-white/70">
              <li><Link to="/learn/courses" className="font-semibold text-white/90 hover:underline">Explore courses</Link></li>
              {course.categoryName ? (
                <>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link to={`/learn/courses?category=${encodeURIComponent(course.categoryName)}`} className="font-semibold text-white/90 hover:underline">
                      {course.categoryName}
                    </Link>
                  </li>
                </>
              ) : null}
            </ol>
          </nav>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{course.title}</h1>
          {course.subtitle ? <p className="mt-3 max-w-3xl text-lg leading-relaxed text-white/85">{course.subtitle}</p> : null}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-wheat px-3 py-1 font-bold text-charcoal">{formatPrice(course.price, course.currency)}</span>
            {meta.map((item) => <span key={item} className="rounded-full border border-white/25 px-3 py-1 text-white/90">{item}</span>)}
          </div>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="min-w-0 space-y-12">
          {course.previewVideoUrl ? (
            <section aria-labelledby="preview-title">
              <SectionHeading id="preview-title" title="Course preview" />
              <div className="overflow-hidden rounded-2xl border border-hairline bg-charcoal shadow-lift">
                <VideoPlayer url={course.previewVideoUrl} title={`${course.title} preview`} />
              </div>
            </section>
          ) : null}

          {course.description ? (
            <section aria-labelledby="about-title">
              <SectionHeading id="about-title" title="About this course" />
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-charcoal">{course.description}</p>
            </section>
          ) : null}

          {course.outcomes?.length ? (
            <div className="rounded-2xl border border-hairline bg-white p-6">
              <ListSection id="outcomes-title" title="What you’ll learn" items={course.outcomes} columns />
            </div>
          ) : null}

          <Outline sections={course.sections} />
          <ListSection id="requirements-title" title="Requirements" items={course.requirements} />

          {course.instructorName ? (
            <section aria-labelledby="instructor-title">
              <SectionHeading id="instructor-title" title="Instructor" />
              <div className="flex items-center gap-4 rounded-2xl border border-hairline bg-white p-5">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-soft text-lg font-bold text-brand" aria-hidden="true">
                  {course.instructorName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
                </span>
                <div>
                  <p className="font-bold text-charcoal">{course.instructorName}</p>
                  {course.categoryName ? <p className="text-sm text-charcoal-muted">{course.categoryName}</p> : null}
                </div>
              </div>
            </section>
          ) : null}

          {course.enrollment && course.enrollment.status !== 'withdrawn' ? (
            <section aria-labelledby="record-title" className="s-card p-6">
              <h2 id="record-title" className="text-lg font-bold">Your learning record</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
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
            </section>
          ) : null}
        </div>

        <aside aria-label="Enroll in this course">
          <ActionCard course={course} />
        </aside>
      </div>

      {related.length ? (
        <section aria-labelledby="related-title">
          <SectionHeading id="related-title" title={`More in ${course.categoryName}`} description="Other published courses in this category." />
          <ul className={CARD_GRID}>
            {related.map((item) => <li key={item.key}><CatalogCard course={item} /></li>)}
          </ul>
        </section>
      ) : null}
    </div>
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
