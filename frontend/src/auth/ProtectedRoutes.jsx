import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BootScreen, ErrorState } from '../components/ui.jsx';

/** Blocks the admin shell until session restore finishes; sends guests to login. */
export function RequireAuth() {
  const { user, ready } = useAuth();
  if (!ready) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Keeps signed-in administrators off the login page. */
export function GuestOnly() {
  const { user, ready } = useAuth();
  if (!ready) return <BootScreen />;
  if (user) return <Navigate to="/" replace />;
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
