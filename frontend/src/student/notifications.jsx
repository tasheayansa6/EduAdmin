import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { BellIcon } from '../components/icons.jsx';

const POLL_MS = 60_000;
const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', items: [], unread: 0, error: null });
  const location = useLocation();

  const load = useCallback(async () => {
    try {
      const result = await api('/api/v1/student/notifications?limit=50');
      setState({ status: 'ready', items: result.data.items, unread: result.data.unread, error: null });
    } catch (error) {
      setState((current) => (current.status === 'ready' ? current : { ...current, status: 'error', error }));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    window.addEventListener('focus', load);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, [load]);

  // Enrolling, paying and finishing lessons all happen on other pages; pick up what they created.
  useEffect(() => {
    load();
  }, [location.pathname, load]);

  const markRead = useCallback(async (ids) => {
    setState((current) => ({
      ...current,
      items: current.items.map((item) => (!ids || ids.includes(item.id) ? { ...item, read: true } : item)),
      unread: ids ? current.items.filter((item) => !item.read && !ids.includes(item.id)).length : 0,
    }));
    try {
      await api('/api/v1/student/notifications/read', { method: 'POST', body: ids ? { ids } : {} });
    } finally {
      load();
    }
  }, [load]);

  const value = useMemo(() => ({ ...state, reload: load, markRead }), [state, load, markRead]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications must be used within NotificationsProvider');
  return context;
}

const MINUTE = 60_000;
export function timeAgo(value) {
  const diff = Date.now() - new Date(value).getTime();
  if (diff < MINUTE) return 'Just now';
  if (diff < 60 * MINUTE) return `${Math.floor(diff / MINUTE)} min ago`;
  if (diff < 24 * 60 * MINUTE) {
    const hours = Math.floor(diff / (60 * MINUTE));
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diff < 7 * 24 * 60 * MINUTE) {
    const days = Math.floor(diff / (24 * 60 * MINUTE));
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

const TYPE_STYLE = {
  payment: 'bg-wheat-soft text-wheat-ink',
  completion: 'bg-brand text-white',
  enrollment: 'bg-brand-soft text-brand',
  security: 'bg-red-50 text-red-800',
  welcome: 'bg-sand text-charcoal',
  course: 'bg-wheat text-charcoal',
};
const TYPE_LABEL = { payment: 'Payment', completion: 'Completed', enrollment: 'Enrollment', security: 'Security', welcome: 'Welcome', course: 'New course' };

export function NotificationItem({ item, onOpen, compact = false }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={`flex w-full gap-3 text-left transition-colors hover:bg-sand ${compact ? 'px-4 py-3' : 'p-4 sm:p-5'} ${item.read ? '' : 'bg-brand-soft/60'}`}
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-wheat'}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${TYPE_STYLE[item.type] ?? 'bg-sand text-charcoal'}`}>
            {TYPE_LABEL[item.type] ?? 'Update'}
          </span>
          <span className="text-xs text-charcoal-muted">{timeAgo(item.createdAt)}</span>
          {item.read ? null : <span className="sr-only">Unread.</span>}
        </span>
        <span className={`mt-1 block text-sm text-charcoal ${item.read ? 'font-semibold' : 'font-bold'}`}>{item.title}</span>
        {item.body ? <span className={`mt-0.5 block text-sm text-charcoal-muted ${compact ? 'line-clamp-2' : ''}`}>{item.body}</span> : null}
      </span>
    </button>
  );
}

export function useOpenNotification() {
  const { markRead } = useNotifications();
  const navigate = useNavigate();
  return useCallback((item) => {
    if (!item.read) markRead([item.id]);
    if (item.link) navigate(item.link);
  }, [markRead, navigate]);
}

export function NotificationBell() {
  const { items, unread, status, markRead } = useNotifications();
  const open = useOpenNotification();
  const [expanded, setExpanded] = useState(false);
  const wrapper = useRef(null);
  const button = useRef(null);
  const location = useLocation();

  useEffect(() => setExpanded(false), [location.pathname]);

  useEffect(() => {
    if (!expanded) return undefined;
    function onPointer(event) {
      if (!wrapper.current?.contains(event.target)) setExpanded(false);
    }
    function onKey(event) {
      if (event.key === 'Escape') {
        setExpanded(false);
        button.current?.focus();
      }
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  const recent = items.slice(0, 6);
  return (
    <div ref={wrapper} className="relative">
      <button
        ref={button}
        type="button"
        className={`icon-btn ${expanded ? 'bg-brand-soft text-brand' : ''}`}
        aria-expanded={expanded}
        aria-controls="notification-menu"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        onClick={() => setExpanded((value) => !value)}
      >
        <BellIcon />
        {unread ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-wheat px-1 text-[11px] font-bold text-charcoal ring-2 ring-white" aria-hidden="true">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>
      {expanded ? (
        <div id="notification-menu" className="absolute right-0 top-full z-40 mt-2 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-hairline bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <p className="font-bold text-charcoal">Notifications</p>
            <button type="button" className="text-sm font-semibold text-brand hover:underline disabled:text-charcoal-muted disabled:no-underline" disabled={!unread} onClick={() => markRead()}>
              Mark all as read
            </button>
          </div>
          {status === 'loading' ? (
            <p className="px-4 py-8 text-center text-sm text-charcoal-muted">Loading…</p>
          ) : status === 'error' ? (
            <p className="px-4 py-8 text-center text-sm text-charcoal-muted">Notifications could not be loaded.</p>
          ) : recent.length ? (
            <ul className="max-h-[26rem] divide-y divide-hairline overflow-y-auto">
              {recent.map((item) => <li key={item.id}><NotificationItem item={item} onOpen={open} compact /></li>)}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-charcoal-muted">No notifications yet. Enrollments, payments and finished courses will show up here.</p>
          )}
          <Link to="/learn/notifications" className="block border-t border-hairline px-4 py-3 text-center text-sm font-semibold text-brand hover:bg-sand">
            See all notifications
          </Link>
        </div>
      ) : null}
    </div>
  );
}
