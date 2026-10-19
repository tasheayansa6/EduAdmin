import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { roleLabel } from '../../lib/format.js';
import { Avatar } from '../ui.jsx';
import {
  BookIcon,
  ChartIcon,
  ClipboardIcon,
  CloseIcon,
  GridIcon,
  LogoutIcon,
  Mark,
  MenuIcon,
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

function SidebarNav({ user, onNavigate }) {
  return (
    <nav className="flex-1 space-y-0.5 px-3" aria-label="Dashboard">
      <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
      {NAV.filter((item) => !item.role || item.role === user.role).map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'bg-accent/10 text-accent' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'}`
            }
          >
            <Icon />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

function AccountCard({ user, onNavigate, onLogout }) {
  return (
    <div className="border-t border-line p-3">
      <NavLink
        to="/profile"
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2.5 ${isActive ? 'bg-accent/10' : 'hover:bg-slate-50'}`
        }
      >
        <Avatar name={user.name} size="sm" />
        <span className="min-w-0 text-left">
          <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
          <span className="block truncate text-xs text-ink-muted">{roleLabel(user.role)}</span>
        </span>
      </NavLink>
      <button type="button" className="nav-link mt-1 w-full text-slate-600 hover:bg-slate-50" onClick={onLogout}>
        <LogoutIcon />
        Log out
      </button>
    </div>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const title = TITLES[location.pathname] ?? 'EduAdmin';

  useEffect(() => {
    document.title = `${title} · EduAdmin`;
    setOpen(false);
  }, [title, location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  function onSearch(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q');
    const text = String(query || '').trim();
    navigate(text ? `/students?q=${encodeURIComponent(text)}` : '/students');
    setOpen(false);
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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/45 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-h-screen">
        <aside
          id="sidebar"
          className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform duration-200 lg:static lg:translate-x-0`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-5">
            <div className="flex items-center gap-3">
              <Mark />
              <div>
                <p className="text-base font-semibold leading-none text-ink">EduAdmin</p>
                <p className="mt-1 text-xs text-ink-muted">Administration</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary lg:hidden"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <SidebarNav user={user} onNavigate={() => setOpen(false)} />

          <AccountCard
            user={user}
            onNavigate={() => setOpen(false)}
            onLogout={onLogout}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <button
                type="button"
                className="btn-secondary lg:hidden"
                aria-expanded={open}
                aria-controls="sidebar"
                aria-label="Open navigation"
                onClick={() => setOpen(true)}
              >
                <MenuIcon />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight text-ink">{title}</h1>
                <p className="hidden text-xs text-ink-muted sm:block">{today}</p>
              </div>
              <form onSubmit={onSearch} className="ml-auto hidden min-w-0 max-w-sm flex-1 md:block" role="search">
                <label className="sr-only" htmlFor="shell-search">Search students</label>
                <input
                  id="shell-search"
                  name="q"
                  className="field bg-slate-50"
                  placeholder="Search students"
                />
              </form>
            </div>
            <form onSubmit={onSearch} className="px-4 pb-3 md:hidden" role="search">
              <label className="sr-only" htmlFor="shell-search-mobile">Search students</label>
              <input
                id="shell-search-mobile"
                name="q"
                className="field bg-slate-50"
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
