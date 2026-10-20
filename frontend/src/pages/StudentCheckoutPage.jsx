import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatDateTime } from '../lib/format.js';
import { AlertIcon, CheckIcon, ClockIcon } from '../components/icons.jsx';
import { useDocumentTitle, useStore } from '../student/StudentData.jsx';
import { StudentError, formatPrice } from '../student/components.jsx';

const COPY = {
  paid: { title: 'Payment received', message: 'You are enrolled. Your new courses are in My learning.', icon: CheckIcon, tone: 'bg-brand-soft text-brand' },
  pending: { title: 'Waiting for Chapa', message: 'Chapa has not confirmed this payment yet. If you finished paying, check again in a moment.', icon: ClockIcon, tone: 'bg-wheat-soft text-wheat-ink' },
  failed: { title: 'Payment not completed', message: 'Chapa did not confirm a matching payment, so no course was added. Your cart is unchanged, so you can try again.', icon: AlertIcon, tone: 'bg-red-50 text-red-700' },
};

/** Chapa sends the student back here; the server re-verifies the payment before showing it as paid. */
export function StudentCheckoutPage() {
  useDocumentTitle('Payment');
  const { txRef } = useParams();
  const { afterEnrollment } = useStore();
  const [state, setState] = useState({ status: 'loading', order: null, error: null });
  const refreshed = useRef(false);
  const onPaid = useRef(afterEnrollment);
  onPaid.current = afterEnrollment;

  const confirm = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const result = await api(`/api/v1/student/orders/${encodeURIComponent(txRef)}/confirm`, { method: 'POST' });
      setState({ status: 'ready', order: result.data, error: null });
      if (result.data.status === 'paid' && !refreshed.current) {
        refreshed.current = true;
        onPaid.current();
      }
    } catch (error) {
      setState({ status: 'error', order: null, error });
    }
  }, [txRef]);

  useEffect(() => {
    confirm();
  }, [confirm]);

  if (state.status === 'error') {
    return <StudentError title="This payment could not be checked" error={state.error} onRetry={confirm} />;
  }
  if (!state.order) {
    return <p className="py-16 text-center text-charcoal-muted" aria-busy="true">Checking your payment with Chapa…</p>;
  }

  const { order } = state;
  const copy = COPY[order.status] ?? COPY.pending;
  const Icon = copy.icon;

  return (
    <div className="mx-auto max-w-xl">
      <div className="s-card p-6 text-center sm:p-8">
        <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full [&_svg]:h-7 [&_svg]:w-7 ${copy.tone}`}><Icon /></div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-charcoal-muted">{copy.message}</p>

        <dl className="mt-6 space-y-2 rounded-xl bg-canvas p-4 text-left text-sm">
          {order.items.map((item) => (
            <div key={item.slug ?? item.title} className="flex justify-between gap-3">
              <dt className="truncate">
                {order.status === 'paid' && item.slug ? <Link to={`/learn/courses/${item.slug}/learn`} className="font-semibold text-brand hover:underline">{item.title}</Link> : item.title}
              </dt>
              <dd className="shrink-0 font-semibold">{formatPrice(item.price, order.currency)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-hairline pt-2 font-bold">
            <dt>Total</dt>
            <dd>{formatPrice(order.amount, order.currency)}</dd>
          </div>
          <div className="flex justify-between gap-3 text-xs text-charcoal-muted">
            <dt>Reference</dt>
            <dd className="truncate font-mono">{order.txRef}</dd>
          </div>
          {order.paidAt ? (
            <div className="flex justify-between text-xs text-charcoal-muted">
              <dt>Paid</dt>
              <dd>{formatDateTime(order.paidAt)}</dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {order.status === 'paid' ? <Link to="/learn/my-learning" className="btn-brand">Go to My learning</Link> : null}
          {order.status === 'pending' ? (
            <button type="button" className="btn-brand" disabled={state.status === 'loading'} onClick={confirm}>
              {state.status === 'loading' ? 'Checking…' : 'Check again'}
            </button>
          ) : null}
          {order.status === 'failed' ? <Link to="/learn/cart" className="btn-brand">Back to cart</Link> : null}
          <Link to="/learn/courses" className="btn-outline">Explore courses</Link>
        </div>
      </div>
    </div>
  );
}
