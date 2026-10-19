import { Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireAuth, RequireRole } from './auth/ProtectedRoutes.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { ErrorState } from './components/ui.jsx';
import { AdminsPage } from './pages/AdminsPage.jsx';
import { CoursesPage } from './pages/CoursesPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { EnrollmentsPage } from './pages/EnrollmentsPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ProgressPage } from './pages/ProgressPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { StudentsPage } from './pages/StudentsPage.jsx';

function NotFound() {
  return <ErrorState title="Page not found" message="That section is not part of the dashboard." />;
}

export function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="enrollments" element={<EnrollmentsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route element={<RequireRole role="super_admin" />}>
            <Route path="administrators" element={<AdminsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
