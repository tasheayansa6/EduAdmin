import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, getToken } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, statusLabel } from '../lib/format.js';
import { CartIcon, CheckIcon, ClockIcon, HeartIcon, LockIcon, PlayIcon } from '../components/icons.jsx';
import { useDocumentTitle, useStore } from '../student/StudentData.jsx';
import { VideoPlayer } from '../student/VideoPlayer.jsx';
import {
  CARD_GRID,
  CourseImage,
  Meter,
  SectionHeading,
  StoreCourseCard,
  StudentData,
  StudentEmpty,
  formatMinutes,
  formatPrice,
} from '../student/components.jsx';

function PreviewPanel({ course, lesson, playerRef }) {
  return (
    <section ref={playerRef} aria-labelledby="preview-title" className="scroll-mt-24 overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft">
      <div className="aspect-video bg-charcoal">
        {lesson ? (
          <VideoPlayer url={lesson.videoUrl} title={`Preview: ${lesson.title}`} />
        ) : (
          <div className="relative h-full">
            <CourseImage course={course} className="h-full" />
            <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-semibold text-white">
              This course has no preview video yet.
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 px-5 py-3 text-sm [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-brand">
        <PlayIcon />
        <h2 id="preview-title" className="font-semibold text-charcoal">
          {lesson ? <>Preview: <span className="font-normal text-charcoal-muted">{lesson.title}</span></> : 'Course preview'}
        </h2>
      </div>
    </section>
  );
}

function PurchaseCard({ course }) {
  const { cart, setInCart, setFavorite, enrollFree, checkout } = useStore();
  const toast = useToast();
  const [pending, setPending] = useState(null);
  const enrollment = course.enrollment;

  async function run(kind, action, message) {
    setPending(kind);
    try {
      await action();
      if (message) toast.success(message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="s-card overflow-hidden lg:sticky lg:top-24">
      <CourseImage course={course} />
      <div className="space-y-4 p-5">
        {enrollment ? (
          <>
            <p className="flex items-center gap-2 text-lg font-bold text-brand [&_svg]:h-5 [&_svg]:w-5">
              <CheckIcon />
              {enrollment.status === 'completed' ? 'You completed this course' : 'You are enrolled'}
            </p>
            {enrollment.percent == null ? null : (
              <div className="space-y-1.5">
                <Meter value={enrollment.percent} label="Course progress" />
                <p className="flex justify-between text-sm">
                  <span className="font-semibold">{enrollment.percent}% complete</span>
                  {enrollment.progressStatus ? <span className="text-charcoal-muted">{statusLabel(enrollment.progressStatus)}</span> : null}
                </p>
              </div>
            )}
            <p className="text-sm text-charcoal-muted">Enrolled on {formatDate(enrollment.enrolledAt)}</p>
            <Link to={`/learn/courses/${course.slug}/learn`} className="btn-brand w-full py-3 text-base">
              {enrollment.percent ? 'Continue learning' : 'Start learning'}
            </Link>
          </>
        ) : (
          <>
            <p className="text-3xl font-extrabold tracking-tight text-charcoal">{formatPrice(course.price, course.currency)}</p>
            {!getToken() ? (
              <>
                <Link
                  to={`/login?next=${encodeURIComponent(`/learn/courses/${course.slug}`)}`}
                  className="btn-brand w-full py-3 text-base"
                >
                  Sign in to enroll
                </Link>
                <p className="text-sm text-charcoal-muted">
                  New here?{' '}
                  <Link to="/register" className="font-bold text-brand hover:underline">Create a free account</Link>
                </p>
              </>
            ) : course.isFree ? (
              <button
                type="button"
                className="btn-brand w-full py-3 text-base"
                disabled={Boolean(pending)}
                onClick={() => run('enroll', () => enrollFree(course.slug), `Enrolled in ${course.title}. It is now in My learning.`)}
              >
                {pending === 'enroll' ? 'Enrolling…' : 'Enroll for free'}
              </button>
            ) : (
              <>
                {course.inCart ? (
                  <Link to="/learn/cart" className="btn-brand w-full py-3 text-base [&_svg]:h-4 [&_svg]:w-4"><CartIcon /> Go to cart</Link>
                ) : (
                  <button
                    type="button"
                    className="btn-brand w-full py-3 text-base [&_svg]:h-4 [&_svg]:w-4"
                    disabled={Boolean(pending)}
                    onClick={() => run('cart', () => setInCart(course, true), 'Added to your cart. Open Cart to pay.')}
                  >
                    <CartIcon />
                    {pending === 'cart' ? 'Adding…' : 'Add to cart'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-wheat w-full py-3 text-base"
                  disabled={Boolean(pending) || !cart.paymentsEnabled}
                  onClick={() => run('pay', () => checkout([course]))}
                >
                  {pending === 'pay' ? 'Opening Chapa…' : 'Buy now'}
                </button>
                {course.favorite && !course.inCart ? (
                  <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">
                    Saved to favorites.{' '}
                    <button type="button" className="font-bold underline underline-offset-2" disabled={Boolean(pending)} onClick={() => run('cart', () => setInCart(course, true), 'Added to your cart.')}>
                      Add to cart
                    </button>
                  </p>
                ) : null}
                <p className="text-xs text-charcoal-muted">
                  {cart.paymentsEnabled
                    ? 'Add the course to your cart, or buy now and pay on Chapa’s secure page.'
                    : 'Online payment is not set up yet. You can still add the course to your cart or favorites.'}
                </p>
              </>
            )}
          </>
        )}
        <button
          type="button"
          className={`btn w-full border px-4 py-2.5 [&_svg]:h-4 [&_svg]:w-4 ${course.favorite ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'border-hairline bg-white text-charcoal hover:bg-sand'}`}
          aria-pressed={Boolean(course.favorite)}
          disabled={Boolean(pending)}
          onClick={() => run('favorite', () => setFavorite(course, !course.favorite), course.favorite ? 'Removed from favorites.' : 'Saved to favorites. You can add it to your cart when you are ready.')}
        >
          <HeartIcon filled={Boolean(course.favorite)} />
          {course.favorite ? 'Saved for later' : 'Save for later'}
        </button>
      </div>
    </div>
  );
}

function Curriculum({ sections, current, onPlay }) {
  const [openText, setOpenText] = useState(null);
  const lessonCount = sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const total = formatMinutes(sections.reduce((sum, section) => sum + section.lessons.reduce((acc, lesson) => acc + (lesson.durationMinutes || 0), 0), 0));

  return (
    <section aria-labelledby="curriculum-title">
      <SectionHeading
        id="curriculum-title"
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
              {section.lessons.map((lesson, lessonIndex) => {
                const key = `${sectionIndex}-${lessonIndex}`;
                const playing = Boolean(current && lesson.videoUrl && current.videoUrl === lesson.videoUrl && current.title === lesson.title);
                return (
                  <li key={key} className="px-5 py-3">
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`[&_svg]:h-4 [&_svg]:w-4 ${lesson.isPreview ? 'text-brand' : 'text-charcoal-muted'}`}>
                        {lesson.isPreview ? <PlayIcon /> : <LockIcon />}
                      </span>
                      <span className={`min-w-0 flex-1 ${playing ? 'font-bold text-brand' : 'text-charcoal'}`}>{lesson.title}</span>
                      {lesson.isPreview && lesson.videoUrl ? (
                        <button type="button" className="shrink-0 font-semibold text-brand underline-offset-2 hover:underline" onClick={() => onPlay(lesson)}>
                          {playing ? 'Playing' : 'Preview'}
                        </button>
                      ) : lesson.isPreview && lesson.content ? (
                        <button type="button" className="shrink-0 font-semibold text-brand underline-offset-2 hover:underline" aria-expanded={openText === key} onClick={() => setOpenText(openText === key ? null : key)}>
                          {openText === key ? 'Hide preview' : 'Read preview'}
                        </button>
                      ) : null}
                      <span className="w-20 shrink-0 text-right text-xs text-charcoal-muted">
                        {lesson.durationMinutes ? formatMinutes(lesson.durationMinutes) : statusLabel(lesson.type || 'lesson')}
                      </span>
                    </div>
                    {openText === key ? (
                      <p className="mt-3 whitespace-pre-line rounded-lg bg-canvas p-4 text-sm leading-relaxed text-charcoal">{lesson.content}</p>
                    ) : null}
                  </li>
                );
              })}
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

function DetailBody({ detail }) {
  const { catalog } = useStore();
  const live = catalog.data?.find((item) => item.slug === detail.slug);
  const course = live ? { ...detail, enrollment: live.enrollment, inCart: live.inCart, favorite: live.favorite } : detail;
  const previews = (course.sections ?? []).flatMap((section) => section.lessons).filter((lesson) => lesson.isPreview && lesson.videoUrl);
  const [lesson, setLesson] = useState(previews[0] ?? null);
  const playerRef = useRef(null);
  useDocumentTitle(course.title);

  function onPlay(next) {
    setLesson(next);
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const others = (catalog.data ?? []).filter((item) => item.slug !== course.slug);
  const sameCategory = others.filter((item) => item.category === course.category);
  const related = (sameCategory.length ? sameCategory : others).slice(0, 4);
  const duration = formatMinutes(course.totalMinutes);
  const meta = [
    course.instructorName ? `By ${course.instructorName}` : null,
    course.level ? statusLabel(course.level) : null,
    course.language || null,
    course.lessonCount ? `${course.lessonCount} lesson${course.lessonCount === 1 ? '' : 's'}` : null,
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
              {course.category ? (
                <>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link to={`/learn/courses?category=${encodeURIComponent(course.category)}`} className="font-semibold text-white/90 hover:underline">
                      {course.category}
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
          <PreviewPanel course={course} lesson={lesson} playerRef={playerRef} />

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

          {course.sections?.length ? <Curriculum sections={course.sections} current={lesson} onPlay={onPlay} /> : null}

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
                  {course.category ? <p className="text-sm text-charcoal-muted">{course.category}</p> : null}
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <aside aria-label="Enroll in this course">
          <PurchaseCard course={course} />
        </aside>
      </div>

      {related.length ? (
        <section aria-labelledby="related-title">
          <SectionHeading
            id="related-title"
            title={sameCategory.length ? `More in ${course.category}` : 'More courses'}
            description="Other published courses you might like."
          />
          <ul className={CARD_GRID}>
            {related.map((item) => <li key={item.slug}><StoreCourseCard course={item} /></li>)}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function StudentCourseDetailPage() {
  const { slug } = useParams();
  const [resource, setResource] = useState({ status: 'loading', data: null, error: null });

  const load = useCallback(async () => {
    setResource({ status: 'loading', data: null, error: null });
    try {
      const result = await api(`/api/v1/student/catalog/${encodeURIComponent(slug)}`);
      setResource({ status: 'ready', data: result.data, error: null });
    } catch (error) {
      setResource({ status: 'error', data: null, error });
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  if ([400, 404].includes(resource.error?.status)) {
    return (
      <StudentEmpty
        title="Course not found"
        message="This course is not published or no longer exists."
        action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
      />
    );
  }

  return (
    <StudentData resource={{ ...resource, reload: load }} label="Loading course" errorTitle="This course could not be loaded">
      {(data) => <DetailBody key={data.slug} detail={data} />}
    </StudentData>
  );
}
