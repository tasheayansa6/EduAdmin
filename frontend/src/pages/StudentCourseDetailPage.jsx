import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, getToken } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, statusLabel } from '../lib/format.js';
import { CartIcon, CheckIcon, HeartIcon, LockIcon, PlayIcon } from '../components/icons.jsx';
import { useDocumentTitle, useStore } from '../student/StudentData.jsx';
import { VideoPlayer } from '../student/VideoPlayer.jsx';
import {
  CARD_GRID,
  Meter,
  StoreCourseCard,
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

function PreviewPanel({ course, lesson, playerRef }) {
  if (!lesson) return null;
  return (
    <ProgramCard id="preview-title" title="Course preview">
      <div ref={playerRef} className="scroll-mt-24 overflow-hidden rounded-xl bg-charcoal">
        <div className="aspect-video">
          <VideoPlayer url={lesson.videoUrl} title={`Preview: ${lesson.title}`} />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-white [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-wheat">
          <PlayIcon />
          <p className="font-semibold">
            Preview: <span className="font-normal text-white/80">{lesson.title}</span>
          </p>
        </div>
      </div>
    </ProgramCard>
  );
}

function PurchaseCard({ course, program, buyIntent = false, onBuyIntentHandled }) {
  const { cart, setInCart, setFavorite, enrollFree, checkout } = useStore();
  const toast = useToast();
  const [pending, setPending] = useState(null);
  const enrollment = course.enrollment;
  const buyStarted = useRef(false);
  const inCart = Boolean(course.inCart)
    || cart.items.some((item) => item.slug && item.slug === course.slug);

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

  useEffect(() => {
    if (!buyIntent || buyStarted.current || enrollment) return;
    if (!getToken()) return;
    buyStarted.current = true;
    onBuyIntentHandled?.();
    if (course.isFree) {
      run('enroll', () => enrollFree(course.slug), `Enrolled in ${course.title}.`);
      return;
    }
    if (cart.paymentsEnabled) {
      run('pay', () => checkout([course]));
    } else {
      run('cart', () => setInCart(course, true), 'Added to your cart. Open Cart to pay.');
    }
  // Intentional: fire once when arriving with ?buy=1
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyIntent, enrollment]);

  return (
    <div id="program-overview" className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-lift lg:sticky lg:top-24">
      <SidebarPreview course={course} category={program.category} />
      <div className="p-5 lg:p-6">
        {enrollment ? (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-brand">You purchased this course</p>
            <p className="flex items-center gap-2 text-lg font-bold text-charcoal [&_svg]:h-5 [&_svg]:w-5">
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
            <Link to={`/learn/courses/${course.slug}/learn`} className="btn-brand w-full py-3.5 text-base">
              {enrollment.percent ? 'Go to course' : 'Start learning'}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-3xl font-extrabold text-charcoal">{formatPrice(course.price, course.currency)}</p>
            <p className="mt-1 text-xs text-charcoal-muted">One-time payment</p>
            <div className="mt-5 space-y-3">
              {!getToken() ? (
                <>
                  <Link
                    to={`/login?next=${encodeURIComponent(`/learn/courses/${course.slug}`)}`}
                    className="btn-brand flex w-full items-center justify-center gap-2 py-4 text-base [&_svg]:h-5 [&_svg]:w-5"
                  >
                    <CartIcon />
                    Sign in to enroll
                  </Link>
                  <p className="text-center text-sm text-charcoal-muted">
                    New here?{' '}
                    <Link to="/register" className="font-bold text-brand hover:underline">Create a free account</Link>
                  </p>
                </>
              ) : course.isFree ? (
                <button
                  type="button"
                  className="btn-brand w-full py-4 text-base"
                  disabled={Boolean(pending)}
                  onClick={() => run('enroll', () => enrollFree(course.slug), `Enrolled in ${course.title}. It is now in My learning.`)}
                >
                  {pending === 'enroll' ? 'Enrolling…' : 'Enroll for free'}
                </button>
              ) : (
                <>
                  {inCart ? (
                    <>
                      <Link to="/learn/cart" className="btn-brand flex w-full items-center justify-center gap-2 py-4 text-base [&_svg]:h-5 [&_svg]:w-5">
                        <CartIcon /> Go to cart
                      </Link>
                      <button
                        type="button"
                        className="btn-outline flex w-full items-center justify-center gap-2 py-3.5 text-base [&_svg]:h-5 [&_svg]:w-5"
                        disabled={Boolean(pending)}
                        onClick={() => run('cart', () => setInCart(course, false), 'Removed from your cart.')}
                      >
                        <CartIcon />
                        {pending === 'cart' ? 'Removing…' : 'Remove from cart'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-outline flex w-full items-center justify-center gap-2 py-3.5 text-base [&_svg]:h-5 [&_svg]:w-5"
                      disabled={Boolean(pending)}
                      onClick={() => run('cart', () => setInCart(course, true), 'Added to your cart. Open Cart to pay.')}
                    >
                      <CartIcon />
                      {pending === 'cart' ? 'Adding…' : 'Add to cart'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-brand flex w-full items-center justify-center gap-2 py-4 text-base [&_svg]:h-5 [&_svg]:w-5"
                    disabled={Boolean(pending) || !cart.paymentsEnabled}
                    onClick={() => run('pay', () => checkout([course]))}
                  >
                    <CartIcon />
                    {pending === 'pay' ? 'Opening Chapa…' : 'Buy Now'}
                  </button>
                  <p className="text-center text-xs text-charcoal-muted">
                    {cart.paymentsEnabled ? 'Secure payment via Chapa' : 'Online payment is not set up yet. You can still add the course to your cart.'}
                  </p>
                </>
              )}
            </div>
            <ProgramOverviewMeta
              category={program.category}
              moduleCount={program.modules.length}
              materialCount={program.materials.length}
            />
          </>
        )}
        <button
          type="button"
          className={`btn mt-4 w-full border px-4 py-2.5 [&_svg]:h-4 [&_svg]:w-4 ${course.favorite ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'border-hairline bg-white text-charcoal hover:bg-sand'}`}
          aria-pressed={Boolean(course.favorite)}
          disabled={Boolean(pending)}
          onClick={() => run('favorite', () => setFavorite(course, !course.favorite), course.favorite ? 'Removed from favorites.' : 'Saved to favorites.')}
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
  const hasLessons = sections.some((section) => section.lessons?.length);

  if (!hasLessons) return null;

  return (
    <ProgramCard
      id="curriculum-title"
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
    </ProgramCard>
  );
}

function DetailBody({ detail }) {
  const { catalog } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const buyIntent = searchParams.get('buy') === '1';
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

  useEffect(() => {
    if (!buyIntent) return;
    document.getElementById('program-overview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [buyIntent]);

  const others = (catalog.data ?? []).filter((item) => item.slug !== course.slug);
  const sameCategory = others.filter((item) => item.category === course.category);
  const related = (sameCategory.length ? sameCategory : others).slice(0, 4);

  return (
    <ProgramDetailChrome
      course={course}
      category={course.category}
      relatedTitle={sameCategory.length ? `More in ${course.category}` : 'More courses'}
      related={related.length ? (
        <ul className={CARD_GRID}>
          {related.map((item) => <li key={item.slug}><StoreCourseCard course={item} /></li>)}
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
            <ProgramModules modules={program.modules} />
            <ProgramMaterials materials={program.materials} />
            <Curriculum sections={course.sections ?? []} current={lesson} onPlay={onPlay} />
            <PreviewPanel course={course} lesson={lesson} playerRef={playerRef} />
            <ProgramAudience items={program.audience} />
          </div>

          <aside className="lg:col-span-1" aria-label="Enroll in this course">
            <PurchaseCard
              course={course}
              program={program}
              buyIntent={buyIntent}
              onBuyIntentHandled={() => {
                searchParams.delete('buy');
                setSearchParams(searchParams, { replace: true });
              }}
            />
          </aside>
        </div>
      )}
    </ProgramDetailChrome>
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
