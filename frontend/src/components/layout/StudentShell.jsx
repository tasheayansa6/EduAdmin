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

const DESKTOP_LINKS = [
  { to: '/learn', label: 'Explore', end: true },
  { to: '/learn/courses', label: 'Catalog' },
  { to: '/learn/my-learning', label: 'My learning' },
  { to: '/learn/progress', label: 'Progress' },
];

function Logo() {
  return (
    <Link to="/learn" className="flex shrink-0 items-center gap-2.5 rounded-md">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-sm font-bold text-wheat">EA</span>
      <span className="leading-none">
        <span className="block font-display text-lg font-bold tracking-tight text-brand">EduAdmin</span>
        <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal-muted">Learning</span>
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
  const button = useRef(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointer(event) {
      if (!wrapper.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
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
        ref={button}
        type="button"
        className="rounded-full p-0.5 ring-2 ring-transparent hover:ring-brand/20"
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
          {[...DESKTOP_LINKS, { to: '/learn/favorites', label: 'Favorites' }, { to: '/learn/cart', label: 'Cart' }, { to: '/learn/notifications', label: 'Notifications' }, { to: '/learn/profile', label: 'Profile' }].map((link) => (
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
  const searchTo = location.pathname.startsWith('/learn/my-learning')
    ? '/learn/my-learning'
    : '/learn/courses';

  function onSearch(event) {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get('q') || '').trim();
    navigate(q ? `${searchTo}?find=${encodeURIComponent(q)}` : searchTo);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4 lg:px-5">
        <button type="button" className="-ml-1 rounded-md p-2 text-charcoal hover:bg-sand md:hidden" aria-label="Open menu" onClick={onOpenMenu}>
          <MenuIcon />
        </button>
        <Logo />
        <nav aria-label="Student" className="ml-4 hidden md:block">
          <ul className="flex items-center gap-0.5">
            {DESKTOP_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) => `inline-flex whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors ${isActive ? 'bg-brand text-white' : 'text-charcoal hover:bg-brand-soft hover:text-brand'}`}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <form onSubmit={onSearch} className="relative ml-auto hidden max-w-xs flex-1 lg:block" role="search">
          <label className="sr-only" htmlFor="student-shell-search">Search courses</label>
          <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-charcoal-muted [&_svg]:h-4 [&_svg]:w-4">
            <SearchIcon />
          </span>
          <input id="student-shell-search" name="q" className="s-field rounded-full pl-10" placeholder="Search courses" />
        </form>
        <div className="ml-auto flex items-center gap-0.5 md:ml-2 lg:ml-1">
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
      <ul className="flex">
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className="bottom-nav-link"
              >
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

          <main id="main" tabIndex={-1} className="mx-auto w-full max-w-shell flex-1 px-4 py-6 pb-24 focus:outline-none sm:px-6 md:pb-10 lg:px-8 lg:py-10">
            <Outlet />
          </main>

          <BottomNav />
        </div>
      </NotificationsProvider>
    </StudentDataProvider>
  );
}
