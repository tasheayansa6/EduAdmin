import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  ArrowRightIcon,
  CheckIcon,
  FlameIcon,
  LeafIcon,
  PlayIcon,
  SearchIcon,
  UserIcon,
} from '../components/icons.jsx';
import { PaceRing } from '../student/charts.jsx';
import { AILG_MEMBERSHIP_URL } from '../student/exploreMenu.js';
import {
  currentEnrollments,
  useAllCourses,
  useDocumentTitle,
  useStore,
  useStudentData,
} from '../student/StudentData.jsx';
import {
  CardGridSkeleton,
  CourseCover,
  CourseImage,
  StudentData,
  StudentEmpty,
  enrollmentLink,
} from '../student/components.jsx';

function FeatureResume({ enrollment }) {
  const percent = enrollment.percent ?? 0;
  const href = enrollmentLink(enrollment);
  const lessonsDone = enrollment.lessonsCompleted ?? 0;
  const lessonsTotal = enrollment.lessonsTotal;
  const resume = percent <= 0 ? 'Start learning' : 'Continue learning';
  const imageUrl = enrollment.courseImageUrl || enrollment.imageUrl || null;
  const [imageBroken, setImageBroken] = useState(false);

  return (
    <article id="active-hero" className="relative overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-soft/40 blur-3xl" aria-hidden="true" />
      <div className="grid min-h-[340px] items-stretch lg:grid-cols-12">
        <div className="relative z-10 flex flex-col justify-between gap-5 p-5 sm:p-6 lg:col-span-7 lg:p-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                In Progress
              </span>
              <span className="text-charcoal-muted">•</span>
              <span className="text-sm font-semibold text-charcoal-muted">
                {enrollment.categoryName || 'Program'}
              </span>
              {lessonsTotal ? (
                <>
                  <span className="text-charcoal-muted">•</span>
                  <span className="text-sm font-semibold text-charcoal-muted">
                    {lessonsDone} of {lessonsTotal} lessons
                  </span>
                </>
              ) : null}
            </div>

            <h2 className="font-display text-3xl font-extrabold leading-snug tracking-tight text-charcoal md:text-4xl lg:text-5xl">
              {enrollment.courseTitle}
            </h2>

            <p className="text-sm leading-relaxed text-charcoal-muted md:text-base">
              <span className="font-semibold text-charcoal">{resume}.</span>
              {' '}
              Your program stays unlocked—pick up anytime.
            </p>

            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-brand">
              <UserIcon />
              <span className="font-semibold text-charcoal">{enrollment.instructorName || 'Instructor TBA'}</span>
              {enrollment.categoryName ? (
                <span className="text-charcoal-muted">· {enrollment.categoryName}</span>
              ) : null}
            </p>

            <div className="pt-1 text-sm">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                <span className="text-charcoal-muted">Progress: {percent}%</span>
                {lessonsTotal ? (
                  <span className="text-charcoal-muted">{lessonsDone}/{lessonsTotal} lessons</span>
                ) : null}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-brand-soft">
                <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to={href}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white shadow-soft hover:bg-brand-hover"
            >
              <PlayIcon />
              {resume}
            </Link>
            <Link
              to="/learn/my-learning"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-brand/25 bg-white px-4 text-sm font-bold text-brand hover:bg-brand-soft"
            >
              My library
            </Link>
          </div>
        </div>

        <div className="relative min-h-[14rem] bg-sand lg:col-span-5 lg:min-h-full">
          {imageUrl && !imageBroken ? (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setImageBroken(true)}
            />
          ) : (
            <CourseCover
              category={enrollment.categoryName}
              title={enrollment.courseTitle}
              className="!aspect-auto absolute inset-0 h-full w-full"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand/70 via-brand/20 to-mint-soft/15" />
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-3.5 shadow-soft backdrop-blur-sm sm:left-auto sm:right-4 sm:w-64">
            <p className="text-[10px] font-bold uppercase tracking-wide text-charcoal-muted">
              Your program
            </p>
            <p className="mt-0.5 text-xs text-charcoal-muted">
              {lessonsTotal
                ? `${lessonsDone} of ${lessonsTotal} lessons complete`
                : `${percent}% complete`}
            </p>
            <p className="mt-1 text-sm font-bold text-brand">{percent > 0 ? 'Resume anytime' : 'Ready to start'}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function CuratedCard({ course }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { enroll } = useStudentData();
  const { enrollFree, afterEnrollment } = useStore();
  const [busy, setBusy] = useState(false);
  const to = course.local || !course.slug
    ? `/learn/my-courses/${course.id}`
    : `/learn/courses/${course.slug}`;
  const learnTo = course.local || !course.slug
    ? `/learn/my-courses/${course.id}/learn`
    : `/learn/courses/${course.slug}/learn`;
  const enrolled = course.enrollment && course.enrollment.status !== 'withdrawn';
  const percent = course.enrollment?.percent ?? 0;
  const modules = course.lessonCount
    || (course.sections || []).reduce((sum, section) => sum + (section.lessons?.length || 0), 0)
    || null;
  const track = course.category || 'Course';
  const about = String(course.description || course.subtitle || '').trim();
  const price = Number(course.price ?? 0);
  const isFree = course.isFree || price <= 0;
  const ctaLabel = enrolled ? 'Continue' : course.isComingSoon ? 'Coming Soon' : isFree ? 'Enroll' : 'Buy Now';

  async function onPrimary() {
    if (enrolled) {
      navigate(learnTo);
      return;
    }
    if (course.isComingSoon) return;
    if (!isFree) {
      navigate(`${to}?buy=1`);
      return;
    }
    setBusy(true);
    try {
      if (course.local || !course.slug) {
        await enroll(course.id ?? course.courseId);
        await afterEnrollment();
      } else {
        await enrollFree(course.slug);
      }
      toast.success(`Enrolled in ${course.title}. It is now in My learning.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-hairline">
      <div className="relative h-40 shrink-0 bg-sand">
        {course.imageUrl ? (
          <CourseImage course={course} className="!aspect-auto h-full w-full object-cover" />
        ) : (
          <CourseCover category={course.category} title={course.title} className="!aspect-auto h-full w-full" />
        )}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-soft ${
          enrolled ? 'bg-brand-soft text-brand' : 'bg-white/95 text-brand'
        }`}
        >
          {enrolled ? 'Enrolled' : course.isComingSoon ? 'Coming Soon' : 'Available'}
        </span>
        {modules ? (
          <span className="absolute bottom-3 left-3 rounded-full bg-charcoal/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {modules} Lessons
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">{track}</span>
          {!enrolled && !course.isComingSoon ? (
            <span className="text-sm font-bold text-charcoal">
              {isFree ? 'Free' : `${price.toLocaleString()} ${course.currency || 'ETB'}`}
            </span>
          ) : null}
        </div>
        <h3 className="font-display text-2xl font-extrabold leading-snug text-charcoal md:text-3xl">
          <Link to={to} className="hover:text-brand">{course.title}</Link>
        </h3>
        {about ? <p className="line-clamp-2 text-sm leading-relaxed text-charcoal-muted">{about}</p> : null}
        <p className="mt-1 flex items-center gap-2 text-sm text-charcoal-muted [&_svg]:h-3.5 [&_svg]:w-3.5">
          <UserIcon />
          {course.instructorName || 'Instructor TBA'}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3">
          {enrolled ? (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-charcoal-muted">Progress: {percent}%</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-brand-soft">
                <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
              </div>
            </div>
          ) : (
            <span className="text-sm text-charcoal-muted">
              {course.level || (isFree ? 'Open enrollment' : 'One-time purchase')}
            </span>
          )}
          <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:w-auto sm:min-w-[16rem]">
            <Link
              to={to}
              className="inline-flex items-center justify-center gap-1 rounded-2xl border border-hairline bg-white px-3.5 py-2.5 text-sm font-bold text-brand shadow-soft hover:border-brand/40"
            >
              Details
            </Link>
            <button
              type="button"
              disabled={busy || course.isComingSoon}
              onClick={onPrimary}
              className="inline-flex items-center justify-center gap-1 rounded-2xl bg-brand px-3.5 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Enrolling…' : ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function HomeBody({ data }) {
  const { user } = useAuth();
  const { favorites } = useStore();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const [category, setCategory] = useState('All');
  const [pathway, setPathway] = useState('recommended');
  const [find, setFind] = useState('');
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState('relevance');

  const current = currentEnrollments(data);
  const savedReady = (favorites || []).filter((item) => !item.unavailable && !item.enrollment);
  const active = current
    .filter((row) => row.status === 'active')
    .sort((a, b) => (b.percent ?? 0) - (a.percent ?? 0));
  const completed = current.filter((row) => row.status === 'completed');
  const featured = active[0];
  const { courses, loading } = useAllCourses();
  const available = courses.filter((course) => !course.enrollment);
  const apiCategories = Array.isArray(data.categories) ? data.categories.map((row) => row.name).filter(Boolean) : [];
  const courseCategories = [...new Set(courses.map((course) => course.category).filter(Boolean))].sort();
  const categories = ['All', ...(courseCategories.length ? courseCategories : apiCategories.length ? apiCategories : ['Communications', 'Media', 'Writing'])];
  const curatedBase = available.length ? available : courses;
  const needle = find.trim().toLowerCase();
  const focusCategory = data.summary?.focusCategory
    || featured?.categoryName
    || current.find((row) => row.categoryName)?.categoryName
    || null;
  const focusLabel = focusCategory || null;

  let curated = curatedBase
    .filter((course) => category === 'All' || course.category === category)
    .filter((course) => !needle || `${course.title} ${course.category || ''} ${course.instructorName || ''}`.toLowerCase().includes(needle));

  if (sort === 'title') {
    curated = [...curated].sort((a, b) => String(a.title).localeCompare(String(b.title)));
  } else if (sort === 'rating') {
    curated = [...curated].sort((a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));
  }
  const totalEligible = curatedBase.length;
  curated = curated.slice(0, 4);

  const weekly = data.summary?.weeklyActivity;
  const lessonsThisWeek = weekly?.thisWeek ?? 0;
  const avgProgress = data.summary?.averageProgress;
  const pathwayPct = avgProgress != null
    ? avgProgress
    : (completed.length || active.length
      ? Math.round((completed.length / Math.max(1, completed.length + active.length)) * 100)
      : 0);
  const continueLearning = active
    .filter((row) => (row.percent ?? 0) < 100)
    .slice(0, 3);
  const featuredLeft = featured?.lessonsTotal != null
    ? Math.max(0, featured.lessonsTotal - (featured.lessonsCompleted ?? 0))
    : null;

  const pathwaySteps = [
    ...completed.slice(0, 2).map((row) => ({
      title: row.courseTitle,
      done: true,
      meta: 'Completed',
    })),
    ...active.slice(0, 1).map((row) => ({
      title: row.courseTitle,
      done: false,
      current: true,
      meta: `In progress · ${row.percent ?? 0}%`,
    })),
    ...curatedBase.slice(0, 1).map((course) => ({
      title: course.title,
      done: false,
      meta: 'Up next',
    })),
  ].slice(0, 4);

  const fallbackSteps = curatedBase.slice(0, 4).map((course, index) => ({
    title: course.title,
    done: index === 0 && completed.length > 0,
    current: index === (completed.length ? 1 : 0) && active.length > 0,
    meta: index < completed.length ? 'Completed' : index === completed.length && active.length ? 'In progress' : 'Up next',
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-5xl font-extrabold tracking-tight text-charcoal md:text-6xl lg:text-[4rem] lg:leading-[1.05]">
                Welcome back, {firstName}!
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" aria-hidden="true" />
                Learning
              </span>
            </div>
            {focusLabel ? (
              <p className="mt-1.5 text-xl font-medium text-charcoal-muted md:text-2xl">
                {focusLabel}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 shadow-soft ring-1 ring-hairline">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand [&_svg]:h-5 [&_svg]:w-5">
                <FlameIcon />
              </span>
              <div>
                <p className="font-display text-xl font-bold leading-none text-charcoal">{lessonsThisWeek}</p>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">Lessons this week</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 shadow-soft ring-1 ring-hairline">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand text-sm font-bold">
                ★
              </span>
              <div>
                <p className="font-display text-xl font-bold leading-none text-charcoal">
                  {avgProgress == null ? '—' : `${avgProgress}%`}
                </p>
                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">Avg progress</p>
              </div>
            </div>
          </div>
        </div>

        {(featured || lessonsThisWeek > 0) ? (
          <div className="flex flex-col gap-3 rounded-xl bg-mint-soft/90 p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-brand shadow-soft [&_svg]:h-5 [&_svg]:w-5">
                <LeafIcon />
              </span>
              <p className="text-sm leading-relaxed text-charcoal-muted md:text-[15px]">
                {featured && featuredLeft != null && featuredLeft > 0 ? (
                  <>
                    <span className="font-bold text-charcoal">Keep going: </span>
                    {featuredLeft} lesson{featuredLeft === 1 ? '' : 's'} left in{' '}
                    <span className="font-bold text-charcoal">&ldquo;{featured.courseTitle}&rdquo;</span>.
                    Programs stay unlocked—resume anytime.
                  </>
                ) : featured ? (
                  <>
                    <span className="font-bold text-charcoal">Keep going: </span>
                    Continue{' '}
                    <span className="font-bold text-charcoal">&ldquo;{featured.courseTitle}&rdquo;</span>
                    {' '}anytime—your access stays unlocked.
                  </>
                ) : lessonsThisWeek > 0 ? (
                  <>
                    <span className="font-bold text-charcoal">Nice work: </span>
                    You completed {lessonsThisWeek} lesson{lessonsThisWeek === 1 ? '' : 's'} this week.
                  </>
                ) : (
                  <>
                    <span className="font-bold text-charcoal">Your library is ready. </span>
                    Open a program and pick up where you left off.
                  </>
                )}
              </p>
            </div>
            {featured ? (
              <a href="#active-hero" className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-bold text-brand hover:underline [&_svg]:h-3.5 [&_svg]:w-3.5">
                Resume
                <ArrowRightIcon />
              </a>
            ) : null}
          </div>
        ) : null}
      </header>

      {featured ? (
        <FeatureResume enrollment={featured} />
      ) : (
        <StudentEmpty
          title="You have not enrolled in a course yet"
          message={
            savedReady.length
              ? 'You liked some courses — open Favorites and tap Enroll, or pick a course below and tap Enroll.'
              : 'Scroll to curated courses below and tap Enroll (free) or Buy Now (paid). Liking a course only saves it — you still need to enroll.'
          }
          action={(
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/learn/courses" className="btn-brand">Enroll from catalog</Link>
              {savedReady.length ? (
                <Link to="/learn/favorites" className="btn-outline">
                  Enroll from favorites ({savedReady.length})
                </Link>
              ) : null}
            </div>
          )}
        />
      )}

      <section aria-labelledby="curated-heading" className="scroll-mt-24 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Course catalog</p>
            <h2 id="curated-heading" className="mt-1 scroll-mt-24 font-display text-4xl font-extrabold tracking-tight text-charcoal md:text-5xl">
              Curated for your path
            </h2>
            <p className="mt-1 text-xl text-charcoal-muted">
              Recommended from published courses
              {focusCategory ? ` in ${focusCategory}` : ''}
              .
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-sand p-1 shadow-inner">
            <button
              type="button"
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                pathway === 'recommended' ? 'bg-white text-charcoal shadow-soft' : 'text-charcoal-muted hover:text-charcoal'
              }`}
              onClick={() => setPathway('recommended')}
            >
              Recommended Track
            </button>
            <button
              type="button"
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                pathway === 'prereq' ? 'bg-white text-charcoal shadow-soft' : 'text-charcoal-muted hover:text-charcoal'
              }`}
              onClick={() => setPathway('prereq')}
            >
              Prerequisite Pathway
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-[14rem] flex-1">
            <label htmlFor="explore-find" className="sr-only">Search courses</label>
            <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
              <SearchIcon />
            </span>
            <input
              id="explore-find"
              type="search"
              className="s-field rounded-full border-hairline bg-white py-2.5 pl-10 text-sm shadow-soft"
              placeholder="Search topics, courses, instructors..."
              value={find}
              onChange={(e) => setFind(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`h-9 shrink-0 rounded-full px-3.5 text-xs font-bold shadow-soft transition ${
                  category === item ? 'bg-brand text-white' : 'bg-white text-charcoal ring-1 ring-hairline hover:bg-mint-soft'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select
              className="s-field rounded-lg border-hairline bg-white py-2 text-sm font-semibold shadow-soft"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              aria-label="Filter by level"
            >
              <option value="all">Filter by Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select
              className="s-field rounded-lg border-hairline bg-white py-2 text-sm font-semibold shadow-soft"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort courses"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="title">Title A–Z</option>
              <option value="rating">Top rated</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 space-y-4">
            {loading ? (
              <CardGridSkeleton count={4} />
            ) : curated.length ? (
              <>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {curated.map((course) => (
                    <li key={course.key || course.id || course.slug}>
                      <CuratedCard course={course} />
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3 text-sm text-charcoal-muted">
                  <p>
                    Showing {curated.length} of {totalEligible} courses
                    {pathway === 'prereq' ? ' · prerequisite pathway' : ''}
                    {focusCategory ? ` · ${focusCategory}` : ''}
                  </p>
                  <Link to="/learn/courses" className="font-bold text-brand hover:underline">
                    View all courses
                  </Link>
                </div>
              </>
            ) : (
              <StudentEmpty
                title="No courses match"
                message="Try another category or search term."
              />
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            {continueLearning.length ? (
              <section className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-hairline">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-extrabold text-charcoal">Continue learning</h3>
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                    {continueLearning.length} open
                  </span>
                </div>
                <p className="mt-1 text-xs text-charcoal-muted">
                  Your programs stay unlocked—pick up anytime.
                </p>
                <ul className="mt-3 divide-y divide-hairline">
                  {continueLearning.map((row) => {
                    const percent = row.percent ?? 0;
                    return (
                      <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-charcoal">{row.courseTitle}</p>
                          <p className="mt-0.5 text-xs text-charcoal-muted">
                            {row.categoryName || 'Program'}
                            {percent > 0 ? ` · ${percent}% complete` : ' · Not started'}
                          </p>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand">
                            <div
                              className="h-full rounded-full bg-brand transition-all"
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                        </div>
                        <Link
                          to={enrollmentLink(row)}
                          className="mt-2 inline-flex text-xs font-bold text-brand hover:underline"
                        >
                          {percent > 0 ? 'Resume →' : 'Start →'}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  to="/learn/my-learning"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-sand py-2.5 text-xs font-bold text-charcoal hover:bg-brand-soft hover:text-brand"
                >
                  View my library
                </Link>
              </section>
            ) : null}

            <section className="rounded-2xl bg-white p-4 shadow-soft ring-1 ring-hairline">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-extrabold text-charcoal">
                  {focusCategory ? `${focusCategory} path` : 'Learning path'}
                </h3>
                <span className="text-xs font-semibold text-brand">Your enrollments</span>
              </div>
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-sand/70 p-3">
                <PaceRing value={pathwayPct} size="md" label="Done" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-charcoal">Path progress</p>
                  <p className="mt-0.5 text-xs text-charcoal-muted">
                    {active.length + completed.length} program{(active.length + completed.length) === 1 ? '' : 's'} enrolled
                    {avgProgress != null ? ` · ${avgProgress}% avg` : ''}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-charcoal-muted">Milestones</p>
              <ul className="mt-2 space-y-3">
                {(pathwaySteps.length ? pathwaySteps : fallbackSteps).map((step) => (
                  <li key={step.title} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full [&_svg]:h-3 [&_svg]:w-3 ${
                      step.done ? 'bg-brand text-white' : step.current ? 'bg-brand-soft text-brand ring-1 ring-brand/30' : 'bg-sand text-charcoal-muted'
                    }`}
                    >
                      {step.done ? <CheckIcon /> : null}
                    </span>
                    <div className="min-w-0">
                      <p className={`leading-snug ${step.done || step.current ? 'font-semibold text-charcoal' : 'text-charcoal-muted'}`}>
                        {step.title}
                      </p>
                      {step.meta ? <p className="mt-0.5 text-xs text-charcoal-muted">{step.meta}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                to="/learn/progress"
                className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline [&_svg]:h-3.5 [&_svg]:w-3.5"
              >
                View full learning path
                <ArrowRightIcon />
              </Link>
            </section>

            <section className="rounded-2xl bg-gradient-to-br from-brand to-brand-hover p-4 text-white shadow-soft">
              <span className="rounded bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                Progress
              </span>
              <h3 className="mt-2 font-display text-xl font-extrabold">See your real activity</h3>
              <p className="mt-1 text-sm text-white/90">
                Charts and completion rates come from lessons you finish—no demo numbers.
              </p>
              <Link
                to="/learn/progress"
                className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg bg-white text-sm font-bold text-brand hover:bg-mint-soft"
              >
                Open progress
              </Link>
            </section>

            <section
              aria-labelledby="membership-heading"
              className="overflow-hidden rounded-2xl border border-hairline bg-[#fbfcf9] shadow-soft"
            >
              <div className="border-b border-hairline/80 bg-gradient-to-r from-brand/[0.06] via-transparent to-wheat/20 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
                  AILG membership
                </p>
              </div>
              <div className="space-y-3 p-4">
                <h3 id="membership-heading" className="font-display text-xl font-extrabold text-charcoal">
                  Join the membership
                </h3>
                <p className="text-sm leading-relaxed text-charcoal-muted">
                  Mentorship, academy access, and field programs from Agricultural Leadership &amp; Investment Group.
                </p>
                <a
                  href={AILG_MEMBERSHIP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-wheat px-4 text-sm font-bold text-brand shadow-soft hover:bg-wheat-hover"
                >
                  Join membership
                  <ArrowRightIcon />
                </a>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}

export function StudentHomePage() {
  useDocumentTitle('Explore');
  const resource = useStudentData();
  return (
    <StudentData resource={resource} label="Loading your learning">
      {(data) => <HomeBody data={data} />}
    </StudentData>
  );
}
