import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { LockIcon } from '../components/icons.jsx';
import { useDocumentTitle, useStore } from '../student/StudentData.jsx';
import { CourseCover, CourseImage, PageSkeleton, PageTitle, StudentEmpty, formatPrice } from '../student/components.jsx';

function courseHref(item) {
  return item.local || !item.slug ? `/learn/my-courses/${item.courseId ?? item.id}` : `/learn/courses/${item.slug}`;
}

function itemKey(item) {
  return item.key || item.slug || `local-${item.courseId ?? item.id}`;
}

function CartRow({ item, busy, onRemove, onSave }) {
  const href = courseHref(item);
  return (
    <li className="flex gap-4 p-4 sm:p-5">
      <Link to={href} className="w-28 shrink-0 overflow-hidden rounded-lg sm:w-40" tabIndex={-1} aria-hidden="true">
        {item.local ? <CourseCover category={item.category} title={item.title} /> : <CourseImage course={item} />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-snug text-charcoal">
            <Link to={href} className="hover:text-brand hover:underline">{item.title}</Link>
          </h3>
          {item.instructorName ? <p className="text-sm text-charcoal-muted">By {item.instructorName}</p> : null}
          {item.unavailable ? <p className="mt-1 text-sm font-semibold text-red-700">This course is no longer available. Remove it to check out.</p> : null}
          {item.enrollment ? <p className="mt-1 text-sm font-semibold text-brand">You are already enrolled. Remove it from your cart.</p> : null}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <button type="button" className="font-semibold text-brand hover:underline disabled:opacity-60" disabled={busy} onClick={onRemove}>Remove</button>
            {!item.unavailable && !item.favorite ? (
              <button type="button" className="font-semibold text-brand hover:underline disabled:opacity-60" disabled={busy} onClick={onSave}>Move to favorites</button>
            ) : null}
          </div>
        </div>
        {!item.unavailable ? <p className="shrink-0 text-lg font-extrabold text-charcoal sm:text-right">{formatPrice(item.price, item.currency)}</p> : null}
      </div>
    </li>
  );
}

export function StudentCartPage() {
  useDocumentTitle('Cart');
  const { cart, savedLoaded, setInCart, setFavorite, checkout } = useStore();
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const payable = cart.items.filter((item) => !item.unavailable && !item.enrollment && Number(item.price) > 0);
  const blocked = cart.items.length !== payable.length;

  async function run(key, action, message) {
    setBusy(key);
    try {
      await action();
      if (message) toast.success(message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(null);
    }
  }

  if (!savedLoaded) return <PageSkeleton label="Loading your cart" />;

  if (!cart.items.length) {
    return (
      <>
        <PageTitle title="Cart" description="Paid courses you plan to buy." />
        <StudentEmpty
          title="Your cart is empty"
          message="Add a paid course to your cart from its card or course page."
          action={<Link to="/learn/courses" className="btn-brand">Explore courses</Link>}
        />
      </>
    );
  }

  return (
    <>
      <PageTitle title="Cart" description={`${cart.items.length} course${cart.items.length === 1 ? '' : 's'} in your cart.`} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-white">
          {cart.items.map((item) => (
            <CartRow
              key={itemKey(item)}
              item={item}
              busy={Boolean(busy)}
              onRemove={() => run(itemKey(item), () => setInCart(item, false), 'Removed from your cart.')}
              onSave={() => run(itemKey(item), async () => {
                await setFavorite(item, true);
                await setInCart(item, false);
              }, 'Moved to favorites.')}
            />
          ))}
        </ul>

        <aside aria-labelledby="summary-title" className="s-card space-y-4 p-5 lg:sticky lg:top-24">
          <h2 id="summary-title" className="text-lg font-bold">Order summary</h2>
          <dl className="space-y-2 text-sm">
            {payable.map((item) => (
              <div key={itemKey(item)} className="flex justify-between gap-3">
                <dt className="truncate text-charcoal-muted">{item.title}</dt>
                <dd className="shrink-0 font-semibold">{formatPrice(item.price, item.currency)}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between border-t border-hairline pt-3">
              <dt className="font-bold">Total</dt>
              <dd className="text-2xl font-extrabold">{cart.mixedCurrencies ? '—' : formatPrice(cart.total, cart.currency)}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn-wheat w-full py-3 text-base [&_svg]:h-4 [&_svg]:w-4"
            disabled={Boolean(busy) || !cart.paymentsEnabled || blocked || cart.mixedCurrencies || !payable.length}
            onClick={() => run('pay', () => checkout(payable))}
          >
            <LockIcon />
            {busy === 'pay' ? 'Opening Chapa…' : 'Pay with Chapa'}
          </button>
          <p className="text-xs text-charcoal-muted">
            {!cart.paymentsEnabled
              ? 'Online payment is not set up yet. Your cart is saved for when it is.'
              : cart.mixedCurrencies
                ? 'Your cart has courses priced in different currencies. Check out one currency at a time.'
                : blocked
                  ? 'Remove the courses marked above before paying.'
                  : 'You pay on Chapa’s secure page. Courses are added to My learning once Chapa confirms the payment.'}
          </p>
        </aside>
      </div>
    </>
  );
}
