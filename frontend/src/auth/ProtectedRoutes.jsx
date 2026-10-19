import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BootScreen, ErrorState } from '../components/ui.jsx';

export function homePath(user) {
  return user?.role === 'student' ? '/learn' : '/';
}

/** Blocks the admin shell until session restore finishes; sends guests to login. */
export function RequireAuth() {
  const { user, ready } = useAuth();
  if (!ready) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { user, ready } = useAuth();
  if (!ready) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/learn" replace />;
  return <Outlet />;
}

export function RequireStudent() {
  const { user, ready } = useAuth();
  if (!ready) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'student') return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Keeps a signed-in account off the login and registration pages. */
export function GuestOnly() {
  const { user, ready } = useAuth();
  if (!ready) return <BootScreen />;
  if (user) return <Navigate to={homePath(user)} replace />;
  return <Outlet />;
}

/** Frontend UX gate only — backend `authorize` remains authoritative. */
export function RequireRole({ role }) {
  const { user } = useAuth();
  if (!user || user.role !== role) {
    return <ErrorState title="Access denied" message="Your account cannot open this page." />;
  }
  return <Outlet />;
}
