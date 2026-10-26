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
  ClipboardIcon,
  CloseIcon,
  CompassIcon,
  HeartIcon,
  LogoutIcon,
  MailIcon,
  MenuIcon,
  PenIcon,
  SearchIcon,
  UserIcon,
} from '../icons.jsx';

const SECTIONS = [
  { to: '/learn', label: 'Explore', end: true, icon: CompassIcon },
  { to: '/learn/my-learning', label: 'Learning', icon: BookIcon },
  { to: '/learn/progress', label: 'Progress', icon: ChartIcon },
  { to: '/learn/profile', label: 'Account', icon: UserIcon },
];

const MORE_LINKS = [
  { to: '/learn/blogs', label: 'Blog', icon: PenIcon },
  { to: '/learn/careers', label: 'Careers', icon: ClipboardIcon },
  { to: '/learn/contact', label: 'Contact', icon: MailIcon },
];

const PAGE_LABELS = {
  '/learn': 'HOME',
  '/learn/courses': 'COURSES',
  '/learn/academy': 'AILG ACADEMY',
  '/learn/my-learning': 'MY LEARNING',
  '/learn/progress': 'MY PROGRESS',
  '/learn/blogs': 'BLOG',
  '/learn/careers': 'CAREERS',
  '/learn/contact': 'CONTACT',
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
  { to: '/learn/blogs', label: 'Blog' },
  { to: '/learn/careers', label: 'Careers' },
  { to: '/learn/contact', label: 'Contact' },
];

function pageLabel(pathname) {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];
  if (pathname.startsWith('/learn/courses/')) return 'COURSE';
  if (pathname.startsWith('/learn/my-courses/')) return 'COURSE';
  if (pathname.startsWith('/learn/blogs/')) return 'BLOG';
  if (pathname.startsWith('/learn/careers/')) return 'CAREERS';
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
  const location = useLocation();
  const nextLogin = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
  const guestLinks = [
    { to: '/learn', label: 'Explore', end: true },
    { to: '/learn/courses', label: 'Courses' },
  ];
  const signedInLinks = [
    ...SECTIONS,
    ...MORE_LINKS,
    { to: '/learn/courses', label: 'Courses' },
    { to: '/learn/favorites', label: 'Favorites' },
    { to: '/learn/cart', label: 'Cart' },
    { to: '/learn/notifications', label: 'Notifications' },
  ];

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
          {user ? (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={user.name} tone="brand" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-charcoal">{user.name}</p>
                <p className="truncate text-xs text-charcoal-muted">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="text-sm font-bold text-charcoal">EduAdmin</p>
              <p className="text-xs text-charcoal-muted">Browse courses without an account</p>
            </div>
          )}
          <button type="button" className="rounded-md p-2 text-charcoal hover:bg-sand" aria-label="Close menu" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Student menu" className="flex-1 overflow-y-auto p-2">
          {(user ? signedInLinks : guestLinks).map((link) => (
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
          {user ? (
            <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[15px] font-semibold text-charcoal hover:bg-sand" onClick={onLogout}>
              <LogoutIcon />
              Log out
            </button>
          ) : (
            <div className="space-y-2 p-1">
              <Link to={nextLogin} onClick={onClose} className="btn-brand flex w-full">Sign in</Link>
              <Link to="/register" onClick={onClose} className="btn-outline flex w-full">Create account</Link>
            </div>
          )}
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
  const searchParam = location.pathname.startsWith('/learn/my-learning') ? 'find' : 'q';
  const nextLogin = `/login?next=${encodeURIComponent(location.pathname + location.search)}`;
  const [searchText, setSearchText] = useState(
    () => new URLSearchParams(location.search).get(searchParam) || '',
  );

  useEffect(() => {
    const fromUrl = new URLSearchParams(location.search).get(searchParam) || '';
    setSearchText(fromUrl);
  }, [location.pathname, location.search, searchParam]);

  useEffect(() => {
    const trimmed = searchText.trim();
    const onTarget = location.pathname === searchTo || location.pathname.startsWith(`${searchTo}/`);
    const current = onTarget ? (new URLSearchParams(location.search).get(searchParam) || '') : '';
    if (onTarget && trimmed === current) return undefined;
    if (!onTarget && !trimmed) return undefined;

    const timer = window.setTimeout(() => {
      navigate(trimmed ? `${searchTo}?${searchParam}=${encodeURIComponent(trimmed)}` : searchTo, { replace: true });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [searchText, location.pathname, location.search, navigate, searchTo, searchParam]);

  return (
    <header className="sticky top-0 z-30 border-b border-hairline/80 bg-[#fbfcf9]/95 backdrop-blur supports-[backdrop-filter]:bg-[#fbfcf9]/90">
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
        <div className="relative ml-auto hidden max-w-xl flex-1 md:block" role="search">
          <label className="sr-only" htmlFor="student-shell-search">Search for anything</label>
          <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
            <SearchIcon />
          </span>
          <input
            id="student-shell-search"
            name="q"
            type="search"
            className="s-field rounded-full border-transparent bg-white pl-10 shadow-soft"
            placeholder="Type to search courses"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="ml-auto flex items-center gap-0.5 md:ml-2">
          <Link to={searchTo} className="icon-btn md:hidden" aria-label="Search">
            <SearchIcon />
          </Link>
          {user ? (
            <>
              <CountLink to="/learn/favorites" label="Favorites" count={favorites.length}><HeartIcon /></CountLink>
              <CountLink to="/learn/cart" label="Cart" count={cart.items.length}><CartIcon /></CountLink>
              <NotificationBell />
              <ProfileMenu user={user} onLogout={onLogout} />
            </>
          ) : (
            <div className="flex items-center gap-2 pl-1">
              <Link to={nextLogin} className="rounded-full px-3 py-1.5 text-sm font-bold text-brand hover:bg-white">
                Sign in
              </Link>
              <Link to="/register" className="rounded-full bg-brand px-3.5 py-1.5 text-sm font-bold text-white hover:bg-brand-hover">
                Join free
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function BottomNav({ guest }) {
  const items = guest
    ? [
      { to: '/learn', label: 'Explore', end: true, icon: CompassIcon },
      { to: '/learn/courses', label: 'Courses', icon: BookIcon },
      { to: '/login', label: 'Sign in', icon: UserIcon },
    ]
    : SECTIONS;

  return (
    <nav className="bottom-nav" aria-label="Primary">
      <ul className="mx-auto flex max-w-lg">
        {items.map((item) => {
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
  const fullBleed = path === '/learn/academy';
  const learnPlayer = /^\/learn\/(courses\/[^/]+|my-courses\/[^/]+)\/learn$/.test(path);
  const exploreHome = path === '/learn';
  const learningHub = path === '/learn/my-learning';

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
        <div className="student-theme relative isolate flex min-h-screen flex-col overflow-x-hidden bg-canvas text-charcoal">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="absolute -left-24 -top-28 h-[22rem] w-[22rem] rounded-full bg-brand/[0.06] blur-3xl" />
            <div className="absolute -right-20 top-32 h-[18rem] w-[18rem] rounded-full bg-brand-soft/50 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent" />
          </div>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:font-semibold">
            Skip to content
          </a>
          <HeaderBar user={user} onLogout={onLogout} onOpenMenu={() => setDrawer(true)} />
          <MobileDrawer open={drawer} onClose={closeDrawer} user={user} onLogout={onLogout} />
          <main
            id="main"
            tabIndex={-1}
            className={
              learnPlayer
                ? 'relative w-full flex-1 overflow-hidden p-0 focus:outline-none'
                : fullBleed
                  ? 'relative w-full flex-1 pb-28 focus:outline-none md:pb-8'
                  : exploreHome || learningHub
                    ? 'relative mx-auto w-full max-w-lg flex-1 px-4 py-5 pb-28 text-base focus:outline-none sm:max-w-2xl sm:px-5 md:max-w-6xl md:px-6 md:py-7 md:pb-8 lg:max-w-7xl'
                    : 'relative mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-28 focus:outline-none sm:px-6 md:max-w-5xl md:pb-8'
            }
          >
            <Outlet />
          </main>
          {learnPlayer ? null : <BottomNav guest={!user} />}
        </div>
      </NotificationsProvider>
    </StudentDataProvider>
  );
}
