import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { CartIcon, HeartIcon } from '../components/icons.jsx';
import { useDocumentTitle, useStore } from '../student/StudentData.jsx';
import { CourseCover, CourseImage, PageSkeleton, PageTitle, StudentEmpty, formatPrice } from '../student/components.jsx';

function courseHref(course) {
  return course.local || !course.slug ? `/learn/my-courses/${course.courseId ?? course.id}` : `/learn/courses/${course.slug}`;
}

function itemKey(course) {
  return course.key || course.slug || `local-${course.courseId ?? course.id}`;
}

function FavoriteRow({ course, busyKey, onAddToCart, onRemove }) {
  const key = itemKey(course);
  const busy = busyKey === key;
  const enrolled = Boolean(course.enrollment);
  const paid = Number(course.price) > 0;
  const href = courseHref(course);

  return (
    <li className="flex gap-4 p-4 sm:gap-5 sm:p-5">
      <Link to={href} className="w-28 shrink-0 overflow-hidden rounded-lg sm:w-40" tabIndex={-1} aria-hidden="true">
        {course.local || !course.imageUrl ? <CourseCover category={course.category} title={course.title} /> : <CourseImage course={course} />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {course.category ? <p className="eyebrow">{course.category}</p> : null}
          <h3 className="mt-1 font-bold leading-snug text-charcoal">
            <Link to={href} className="hover:text-brand hover:underline">{course.title}</Link>
          </h3>
          {course.subtitle ? <p className="mt-1 line-clamp-2 text-sm text-charcoal-muted">{course.subtitle}</p> : null}
          {enrolled ? <p className="mt-2 text-sm font-semibold text-brand">You are enrolled in this course.</p> : null}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <button type="button" className="inline-flex items-center gap-1 font-semibold text-charcoal-muted hover:text-red-700 disabled:opacity-60 [&_svg]:h-4 [&_svg]:w-4" disabled={busy} onClick={onRemove}>
              <HeartIcon filled />
              Remove
            </button>
            <Link to={href} className="font-semibold text-brand hover:underline">View course</Link>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end sm:text-right">
          <p className={`text-lg font-extrabold ${paid ? 'text-charcoal' : 'text-brand'}`}>{formatPrice(course.price, course.currency)}</p>
          {enrolled ? (
            <Link to={href} className="btn-brand">Go to course</Link>
          ) : paid ? (
            course.inCart ? (
              <Link to="/learn/cart" className="btn-brand [&_svg]:h-4 [&_svg]:w-4"><CartIcon /> Go to cart</Link>
            ) : (
              <button type="button" className="btn-brand [&_svg]:h-4 [&_svg]:w-4" disabled={busy} onClick={onAddToCart}>
                <CartIcon />
                {busy ? 'Adding…' : 'Add to cart'}
              </button>
            )
          ) : (
            <Link to={href} className="btn-brand">Enroll free</Link>
          )}
        </div>
      </div>
    </li>
  );
}

export function StudentFavoritesPage() {
  useDocumentTitle('Favorites');
  const { favorites, savedLoaded, setInCart, setFavorite } = useStore();
  const toast = useToast();
  const [busyKey, setBusyKey] = useState(null);
  const available = favorites.filter((item) => !item.unavailable);

  async function run(course, action, message) {
    const key = itemKey(course);
    setBusyKey(key);
    try {
      await action();
      if (message) toast.success(message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyKey(null);
    }
  }

  if (!savedLoaded) return <PageSkeleton label="Loading your favorites" />;

  return (
    <>
      <PageTitle title="Favorites" description="Courses you saved for later. Add a paid course to your cart when you are ready to buy." />
      {available.length ? (
        <>
          <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-white">
            {available.map((course) => (
              <FavoriteRow
                key={itemKey(course)}
                course={course}
                busyKey={busyKey}
                onAddToCart={() => run(course, () => setInCart(course, true), `${course.title} is in your cart.`)}
                onRemove={() => run(course, () => setFavorite(course, false), 'Removed from favorites.')}
              />
            ))}
          </ul>
          <p className="mt-6 text-center text-sm text-charcoal-muted">
            Ready to buy?{' '}
            <Link to="/learn/cart" className="font-semibold text-brand hover:underline">Open your cart</Link>
          </p>
        </>
      ) : (
        <StudentEmpty
          title="No favorites yet"
          message="Tap Save for later on a course you like and it will be saved here."
          action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
        />
      )}
    </>
  );
}
