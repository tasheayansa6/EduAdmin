import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../ui.jsx';
import { CloseIcon, LogoutIcon, Mark, MenuIcon } from '../icons.jsx';

const LINKS = [
  { to: '/learn', label: 'Dashboard', end: true },
  { to: '/learn/courses', label: 'Courses' },
];

const TITLES = {
  '/learn': 'Dashboard',
  '/learn/courses': 'Courses',
  '/learn/profile': 'Profile',
};

export function StudentShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const title = TITLES[location.pathname] ?? 'EduAdmin';
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  useEffect(() => {
    document.title = `${title} · EduAdmin`;
    setOpen(false);
  }, [title, location.pathname]);

  async function onLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  function onSearch(event) {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get('q') || '').trim();
    navigate(text ? `/learn/courses?q=${encodeURIComponent(text)}` : '/learn/courses');
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-paper">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      {open ? (
        <button type="button" className="fixed inset-0 z-30 bg-ink/45 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />
      ) : null}
      <div className="flex min-h-screen">
        <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform duration-200 lg:static lg:translate-x-0`}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-5">
            <div className="flex items-center gap-3">
              <Mark />
              <div>
                <p className="text-base font-semibold leading-none text-ink">EduAdmin</p>
                <p className="mt-1 text-xs text-ink-muted">Student</p>
              </div>
            </div>
            <button type="button" className="btn-secondary lg:hidden" aria-label="Close navigation" onClick={() => setOpen(false)}>
              <CloseIcon />
            </button>
          </div>
          <nav className="flex-1 space-y-0.5 px-3 pt-4" aria-label="Student">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Learning</p>
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `nav-link ${isActive ? 'bg-accent/10 text-accent' : 'text-slate-600 hover:bg-slate-50 hover:text-ink'}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-line p-3">
            <NavLink
              to="/learn/profile"
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 ${isActive ? 'bg-accent/10' : 'hover:bg-slate-50'}`}
            >
              <Avatar name={user.name} size="sm" />
              <span className="min-w-0 text-left">
                <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
                <span className="block truncate text-xs text-ink-muted">Student</span>
              </span>
            </NavLink>
            <button type="button" className="nav-link mt-1 w-full text-slate-600 hover:bg-slate-50" onClick={onLogout}>
              <LogoutIcon />
              Log out
            </button>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
              <button type="button" className="btn-secondary lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
                <MenuIcon />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight text-ink">{title}</h1>
                <p className="hidden text-xs text-ink-muted sm:block">{today}</p>
              </div>
              <form onSubmit={onSearch} className="ml-auto hidden min-w-0 max-w-sm flex-1 md:block" role="search">
                <label className="sr-only" htmlFor="course-search">Search your courses</label>
                <input id="course-search" name="q" className="field bg-slate-50" placeholder="Search your courses" />
              </form>
            </div>
            <form onSubmit={onSearch} className="px-4 pb-3 md:hidden" role="search">
              <label className="sr-only" htmlFor="course-search-mobile">Search your courses</label>
              <input id="course-search-mobile" name="q" className="field bg-slate-50" placeholder="Search your courses" />
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
