import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { StudentDataProvider, useStore } from '../../student/StudentData.jsx';
import { NotificationBell, NotificationsProvider } from '../../student/notifications.jsx';
import { Avatar } from '../ui.jsx';
import {
  BookIcon,
  CartIcon,
  ChartIcon,
  CloseIcon,
  CompassIcon,
  HeartIcon,
  LogoutIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from '../icons.jsx';

const SECTIONS = [
  { to: '/learn', label: 'Explore', end: true, icon: CompassIcon },
  { to: '/learn/my-learning', label: 'Learning', icon: BookIcon },
  { to: '/learn/progress', label: 'Progress', icon: ChartIcon },
  { to: '/learn/profile', label: 'Account', icon: UserIcon },
];

const PAGE_LABELS = {
  '/learn': 'HOME',
  '/learn/courses': 'COURSES',
  '/learn/my-learning': 'MY LEARNING',
  '/learn/progress': 'MY PROGRESS',
  '/learn/profile': 'ACCOUNT',
  '/learn/favorites': 'FAVORITES',
  '/learn/cart': 'CART',
  '/learn/notifications': 'NOTIFICATIONS',
};

const DESKTOP_NAV = [
  { to: '/learn', label: 'Explore', end: true },
  { to: '/learn/courses', label: 'Courses' },
  { to: '/learn/my-learning', label: 'Learning' },
  { to: '/learn/progress', label: 'Progress' },
];

function pageLabel(pathname) {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  if (pathname.startsWith('/learn/courses/')) return 'COURSE';
  if (pathname.startsWith('/learn/my-courses/')) return 'COURSE';
  if (pathname.startsWith('/learn/profile')) return 'ACCOUNT';
  return 'LEARNING';
}

function Logo({ subtitle }) {
  return (
    <Link to="/learn" className="flex min-w-0 items-center gap-2.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand text-wheat shadow-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3z" />
          <path d="M5 13.18V17c0 1.66 3.13 3 7 3s7-1.34 7-3v-3.82l-7 3.82-7-3.82z" opacity=".85" />
        </svg>
      </span>
      <span className="min-w-0 leading-none">
        <span className="block font-display text-lg font-bold tracking-tight text-brand">EduAdmin</span>
        <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-[0.16em] text-charcoal-muted">{subtitle}</span>
      </span>
    </Link>
  );
}

function CountLink({ to, label, count, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `icon-btn ${isActive ? 'bg-brand-soft text-brand' : ''}`}
      aria-label={`${label}${count ? `, ${count} item${count === 1 ? '' : 's'}` : ''}`}
    >
      {children}
      {count ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-wheat px-1 text-[11px] font-bold text-charcoal ring-2 ring-white" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </NavLink>
  );
}

function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event) {
      if (!wrapper.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        className="rounded-full p-0.5 ring-2 ring-brand/15 hover:ring-brand/35"
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={user.name} tone="brand" />
        <span className="sr-only">Account menu for {user.name}</span>
      </button>
      {open ? (
        <div id="profile-menu" className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-hairline bg-white shadow-lift">
          <div className="flex items-center gap-3 border-b border-hairline p-4">
            <Avatar name={user.name} size="lg" tone="brand" />
            <div className="min-w-0">
              <p className="truncate font-bold text-charcoal">{user.name}</p>
              <p className="truncate text-sm text-charcoal-muted">{user.email}</p>
            </div>
          </div>
          <ul className="p-2 text-sm">
            <li><Link to="/learn/my-learning" className="block rounded-xl px-3 py-2 font-semibold text-charcoal hover:bg-sand">My learning</Link></li>
            <li><Link to="/learn/progress" className="block rounded-xl px-3 py-2 font-semibold text-charcoal hover:bg-sand">Progress</Link></li>
            <li><Link to="/learn/notifications" className="block rounded-xl px-3 py-2 font-semibold text-charcoal hover:bg-sand">Notifications</Link></li>
            <li><Link to="/learn/favorites" className="block rounded-xl px-3 py-2 font-semibold text-charcoal hover:bg-sand">Favorites</Link></li>
            <li><Link to="/learn/cart" className="block rounded-xl px-3 py-2 font-semibold text-charcoal hover:bg-sand">Cart</Link></li>
            <li><Link to="/learn/profile" className="block rounded-xl px-3 py-2 font-semibold text-charcoal hover:bg-sand">Edit profile</Link></li>
            <li><Link to="/learn/profile/security" className="block rounded-xl px-3 py-2 font-semibold text-charcoal hover:bg-sand">Account security</Link></li>
          </ul>
          <div className="border-t border-hairline p-2">
            <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-charcoal hover:bg-sand [&_svg]:h-4 [&_svg]:w-4" onClick={onLogout}>
              <LogoutIcon />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MobileDrawer({ open, onClose, user, onLogout }) {
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    panel.current?.querySelector('a, button')?.focus();
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button type="button" className="absolute inset-0 bg-charcoal/50" aria-label="Close menu" onClick={onClose} />
      <div ref={panel} role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-white shadow-lift">
        <div className="flex items-center justify-between border-b border-hairline p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={user.name} tone="brand" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-charcoal">{user.name}</p>
              <p className="truncate text-xs text-charcoal-muted">{user.email}</p>
            </div>
          </div>
          <button type="button" className="rounded-md p-2 text-charcoal hover:bg-sand" aria-label="Close menu" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Student menu" className="flex-1 overflow-y-auto p-2">
          {[...SECTIONS, { to: '/learn/courses', label: 'Courses' }, { to: '/learn/favorites', label: 'Favorites' }, { to: '/learn/cart', label: 'Cart' }, { to: '/learn/notifications', label: 'Notifications' }].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) => `block rounded-xl px-3 py-2.5 text-[15px] font-semibold ${isActive ? 'bg-brand-soft text-brand' : 'text-charcoal hover:bg-sand'}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-hairline p-2">
          <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[15px] font-semibold text-charcoal hover:bg-sand" onClick={onLogout}>
            <LogoutIcon />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function HeaderBar({ user, onLogout, onOpenMenu }) {
  const { cart, favorites } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const subtitle = pageLabel(location.pathname);
  const searchTo = location.pathname.startsWith('/learn/my-learning')
    ? '/learn/my-learning'
    : '/learn/courses';

  function onSearch(event) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get('q') || '').trim();
    navigate(q ? `${searchTo}?find=${encodeURIComponent(q)}` : searchTo);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-hairline/80 bg-mint-soft/95 backdrop-blur supports-[backdrop-filter]:bg-mint-soft/90">
      <div className="flex h-16 items-center gap-3 px-3 sm:px-5">
        <button type="button" className="-ml-1 rounded-xl p-2 text-charcoal hover:bg-white md:hidden" aria-label="Open menu" onClick={onOpenMenu}>
          <MenuIcon />
        </button>
        <Logo subtitle={subtitle} />
        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
          {DESKTOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  isActive ? 'bg-brand text-white' : 'text-charcoal-muted hover:bg-white hover:text-charcoal'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <form onSubmit={onSearch} className="relative ml-auto hidden max-w-xs flex-1 md:block" role="search">
          <label className="sr-only" htmlFor="student-shell-search">Search courses</label>
          <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
            <SearchIcon />
          </span>
          <input id="student-shell-search" name="q" className="s-field rounded-full border-transparent bg-white pl-10 shadow-soft" placeholder="Search courses" />
        </form>
        <div className="ml-auto flex items-center gap-0.5 md:ml-2">
          <Link to={searchTo} className="icon-btn md:hidden" aria-label="Search">
            <SearchIcon />
          </Link>
          <CountLink to="/learn/favorites" label="Favorites" count={favorites.length}><HeartIcon /></CountLink>
          <CountLink to="/learn/cart" label="Cart" count={cart.items.length}><CartIcon /></CountLink>
          <NotificationBell />
          <ProfileMenu user={user} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <ul className="mx-auto flex max-w-lg">
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex flex-1">
              <NavLink to={item.to} end={item.end} className="bottom-nav-link">
                <span className="bottom-nav-icon">
                  <Icon />
                </span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function StudentShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const closeDrawer = useCallback(() => setDrawer(false), []);
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const compactLayout = path === '/learn' || path === '/learn/my-learning';

  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <StudentDataProvider>
      <NotificationsProvider>
        <div className="student-theme flex min-h-screen flex-col bg-canvas text-charcoal">
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:font-semibold">
            Skip to content
          </a>
          <HeaderBar user={user} onLogout={onLogout} onOpenMenu={() => setDrawer(true)} />
          <MobileDrawer open={drawer} onClose={closeDrawer} user={user} onLogout={onLogout} />
          <main
            id="main"
            tabIndex={-1}
            className={
              compactLayout
                ? 'student-compact-shell ml-0 mr-auto w-full max-w-lg flex-1 px-4 py-4 pb-28 text-left focus:outline-none sm:max-w-xl sm:px-5 sm:py-5 md:pb-8'
                : 'mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-28 focus:outline-none sm:px-6 md:max-w-5xl md:pb-8'
            }
          >
            <Outlet />
          </main>
          <BottomNav />
        </div>
      </NotificationsProvider>
    </StudentDataProvider>
  );
}
