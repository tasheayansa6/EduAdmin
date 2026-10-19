import { Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireAdmin, RequireRole, RequireStudent } from './auth/ProtectedRoutes.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { StudentShell } from './components/layout/StudentShell.jsx';
import { ErrorState } from './components/ui.jsx';
import { AdminsPage } from './pages/AdminsPage.jsx';
import { CoursesPage } from './pages/CoursesPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { EnrollmentsPage } from './pages/EnrollmentsPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ProgressPage } from './pages/ProgressPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';
import { StudentCoursesPage } from './pages/StudentCoursesPage.jsx';
import { StudentHomePage } from './pages/StudentHomePage.jsx';
import { StudentsPage } from './pages/StudentsPage.jsx';

function NotFound() {
  return <ErrorState title="Page not found" message="That section is not part of the dashboard." />;
}

export function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireStudent />}>
        <Route element={<StudentShell />}>
          <Route path="learn" element={<StudentHomePage />} />
          <Route path="learn/courses" element={<StudentCoursesPage />} />
          <Route path="learn/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route element={<RequireAdmin />}>
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
