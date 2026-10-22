import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { roleLabel } from '../../lib/format.js';
import { Avatar } from '../ui.jsx';
import {
  BookIcon,
  ChartIcon,
  ChevronDownIcon,
  ClipboardIcon,
  GridIcon,
  LogoutIcon,
  Mark,
  ShieldIcon,
  TrendIcon,
  UsersIcon,
} from '../icons.jsx';

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

function SidebarNav({ user }) {
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Dashboard">
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Workspace</p>
      {NAV.filter((item) => !item.role || item.role === user.role).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `nav-link rounded-md ${
                isActive
                  ? 'border-l-4 border-accent bg-slate-100 text-ink'
                  : 'border-l-4 border-transparent text-slate-700 hover:bg-slate-50 hover:text-ink'
              }`
            }
          >
            <Icon />
            <span className="truncate">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
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
        className="flex items-center gap-2 border border-line bg-white px-2 py-1.5 text-ink-muted hover:bg-slate-50"
        aria-expanded={open}
        aria-controls="admin-profile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={user.name} size="sm" />
        <span className="hidden min-w-0 text-left sm:block">
          <span className="block max-w-[9rem] truncate text-sm font-semibold text-ink">{user.name}</span>
          <span className="block max-w-[9rem] truncate text-xs text-ink-muted">{roleLabel(user.role)}</span>
        </span>
        <span className="sr-only sm:hidden">Account menu for {user.name}</span>
        <span className={`[&_svg]:h-4 [&_svg]:w-4 ${open ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
      {open ? (
        <div
          id="admin-profile-menu"
          className="absolute right-0 top-full z-40 mt-1 w-72 border border-line bg-white"
        >
          <div className="flex items-center gap-3 border-b border-line p-4">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{user.name}</p>
              <p className="truncate text-sm text-ink-muted">{user.email}</p>
            </div>
          </div>
          <ul className="p-1 text-sm">
            <li>
              <Link to="/profile" className="block px-3 py-2.5 font-semibold text-ink hover:bg-slate-50">
                Edit profile
              </Link>
            </li>
          </ul>
          <div className="border-t border-line p-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-slate-50 [&_svg]:h-4 [&_svg]:w-4"
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
  const title = TITLES[location.pathname] ?? 'EduAdmin';

  useEffect(() => {
    document.title = `${title} · EduAdmin`;
  }, [title, location.pathname]);

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  function onSearch(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q');
    const text = String(query || '').trim();
    navigate(text ? `/students?q=${encodeURIComponent(text)}` : '/students');
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-paper">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-line focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <div className="flex min-h-screen">
        <aside
          id="sidebar"
          className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-line bg-white sm:w-64"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-4">
            <Mark />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-none text-ink">EduAdmin</p>
              <p className="mt-1 truncate text-xs text-ink-muted">Administration</p>
            </div>
          </div>
          <SidebarNav user={user} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-line bg-white">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight text-ink">{title}</h1>
                <p className="hidden text-xs text-ink-muted sm:block">{today}</p>
              </div>
              <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
                <form onSubmit={onSearch} className="hidden min-w-0 max-w-sm flex-1 md:block" role="search">
                  <label className="sr-only" htmlFor="shell-search">Search students</label>
                  <input
                    id="shell-search"
                    name="q"
                    className="field"
                    placeholder="Search students"
                  />
                </form>
                <ProfileMenu user={user} onLogout={onLogout} />
              </div>
            </div>
            <form onSubmit={onSearch} className="border-t border-line px-4 py-3 md:hidden" role="search">
              <label className="sr-only" htmlFor="shell-search-mobile">Search students</label>
              <input
                id="shell-search-mobile"
                name="q"
                className="field"
                placeholder="Search students"
              />
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
