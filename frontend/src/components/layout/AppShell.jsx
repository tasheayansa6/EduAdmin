import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { roleLabel } from '../../lib/format.js';
import { Avatar } from '../ui.jsx';
import {
  BellIcon,
  BookIcon,
  ChartIcon,
  ChevronDownIcon,
  ClipboardIcon,
  CloseIcon,
  GridIcon,
  LogoutIcon,
  Mark,
  MenuIcon,
  PanelLeftIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  TrendIcon,
  UsersIcon,
} from '../icons.jsx';

const SIDEBAR_KEY = 'eduadmin.sidebarCollapsed';

const NAV = [
  { to: '/', label: 'Dashboard', icon: GridIcon, end: true },
  { to: '/students', label: 'Students', icon: UsersIcon },
  { to: '/courses', label: 'Courses', icon: BookIcon },
  { to: '/enrollments', label: 'Enrollments', icon: ClipboardIcon },
  { to: '/progress', label: 'Progress', icon: TrendIcon },
  { to: '/reports', label: 'Reports', icon: ChartIcon },
  { to: '/administrators', label: 'Administrators', icon: ShieldIcon, role: 'super_admin' },
];

const TITLES = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/courses': 'Courses',
  '/enrollments': 'Enrollments',
  '/progress': 'Progress',
  '/reports': 'Reports',
  '/administrators': 'Administrators',
  '/profile': 'Profile',
};

function SidebarNav({ user, collapsed, onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Dashboard">
      {!collapsed ? (
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
      ) : null}
      {NAV.filter((item) => !item.role || item.role === user.role).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            onClick={onNavigate}
            className={({ isActive }) =>
              `nav-link ${collapsed ? 'justify-center px-2' : ''} ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
              }`
            }
          >
            <Icon />
            {!collapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);

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
        className="admin-icon-btn"
        aria-expanded={open}
        aria-controls="admin-notifications"
        aria-label="Notifications"
        onClick={() => setOpen((value) => !value)}
      >
        <BellIcon />
      </button>
      {open ? (
        <div
          id="admin-notifications"
          className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <p className="text-xs text-ink-muted">Operational alerts for this workspace</p>
          </div>
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-semibold text-ink">You are all caught up</p>
            <p className="mt-1 text-sm text-ink-muted">New enrollment and course events will appear here.</p>
            <Link to="/reports" className="mt-4 inline-flex text-sm font-semibold text-accent hover:text-accent-hover" onClick={() => setOpen(false)}>
              Open reports
            </Link>
          </div>
        </div>
      ) : null}
    </div>
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
    <div ref={wrapper} className="relative shrink-0">
      <button
        ref={button}
        type="button"
        className="flex items-center gap-2 rounded-xl border border-line bg-white py-1 pl-1 pr-2 shadow-soft hover:bg-slate-50"
        aria-expanded={open}
        aria-controls="admin-profile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={user.name} size="sm" />
        <span className="hidden min-w-0 text-left md:block">
          <span className="block max-w-[8.5rem] truncate text-sm font-semibold text-ink">{user.name}</span>
          <span className="block max-w-[8.5rem] truncate text-xs text-ink-muted">{roleLabel(user.role)}</span>
        </span>
        <span className="sr-only md:hidden">Account menu for {user.name}</span>
        <span className={`text-ink-muted [&_svg]:h-4 [&_svg]:w-4 ${open ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
      {open ? (
        <div
          id="admin-profile-menu"
          className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
        >
          <div className="flex items-center gap-3 border-b border-line p-4">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user.name}</p>
              <p className="truncate text-sm text-ink-muted">{user.email}</p>
            </div>
          </div>
          <ul className="p-2 text-sm">
            <li>
              <Link to="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2.5 font-semibold text-ink hover:bg-slate-50">
                <SettingsIcon />
                Account settings
              </Link>
            </li>
          </ul>
          <div className="border-t border-line p-2">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-slate-50 [&_svg]:h-4 [&_svg]:w-4"
              onClick={onLogout}
            >
              <LogoutIcon />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = TITLES[location.pathname] ?? 'EduAdmin';

  useEffect(() => {
    document.title = `${title} · EduAdmin`;
    setMobileOpen(false);
  }, [title, location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  function onSearch(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q');
    const text = String(query || '').trim();
    navigate(text ? `/students?q=${encodeURIComponent(text)}` : '/students');
    setMobileOpen(false);
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const sidebar = (
    <>
      <div className={`flex items-center gap-3 border-b border-line px-4 py-4 ${collapsed ? 'justify-center' : ''}`}>
        <Mark />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-none text-ink">EduAdmin</p>
            <p className="mt-1 truncate text-xs text-ink-muted">Administration</p>
          </div>
        ) : null}
      </div>
      <SidebarNav user={user} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
      <div className="border-t border-line p-3">
        <button
          type="button"
          className={`admin-icon-btn w-full ${collapsed ? '' : 'sm:justify-start sm:gap-2 sm:px-3'}`}
          onClick={() => setCollapsed((value) => !value)}
          aria-pressed={collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeftIcon />
          {!collapsed ? <span className="hidden text-sm font-semibold sm:inline">Collapse</span> : null}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:border focus:border-line focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen">
        {/* Desktop / tablet static collapsible rail */}
        <aside
          id="sidebar"
          className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-white lg:flex ${
            collapsed ? 'w-[4.5rem]' : 'w-64'
          }`}
        >
          {sidebar}
        </aside>

        {/* Mobile overlay menu (no slide animation) */}
        {mobileOpen ? (
          <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-white lg:hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-4">
              <div className="flex items-center gap-3">
                <Mark />
                <div>
                  <p className="text-base font-semibold leading-none text-ink">EduAdmin</p>
                  <p className="mt-1 text-xs text-ink-muted">Administration</p>
                </div>
              </div>
              <button type="button" className="admin-icon-btn" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <SidebarNav user={user} collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <button
                type="button"
                className="admin-icon-btn lg:hidden"
                aria-expanded={mobileOpen}
                aria-controls="sidebar"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight text-ink sm:text-xl">{title}</h1>
                <p className="hidden text-xs text-ink-muted sm:block">{today}</p>
              </div>
              <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
                <form onSubmit={onSearch} className="relative hidden min-w-0 max-w-md flex-1 md:block" role="search">
                  <label className="sr-only" htmlFor="shell-search">Search students</label>
                  <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-ink-muted [&_svg]:h-4 [&_svg]:w-4">
                    <SearchIcon />
                  </span>
                  <input
                    id="shell-search"
                    name="q"
                    className="field pl-10"
                    placeholder="Search students"
                  />
                </form>
                <NotificationsMenu />
                <ProfileMenu user={user} onLogout={onLogout} />
              </div>
            </div>
            <form onSubmit={onSearch} className="border-t border-line px-4 py-3 md:hidden" role="search">
              <label className="sr-only" htmlFor="shell-search-mobile">Search students</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-ink-muted [&_svg]:h-4 [&_svg]:w-4">
                  <SearchIcon />
                </span>
                <input
                  id="shell-search-mobile"
                  name="q"
                  className="field pl-10"
                  placeholder="Search students"
                />
              </div>
            </form>
          </header>
          <main id="main" className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
