import { Link, Route, Routes } from 'react-router-dom';
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
import { StudentCartPage } from './pages/StudentCartPage.jsx';
import { StudentCheckoutPage } from './pages/StudentCheckoutPage.jsx';
import { StudentCourseDetailPage } from './pages/StudentCourseDetailPage.jsx';
import { StudentCoursePlayerPage } from './pages/StudentCoursePlayerPage.jsx';
import { StudentCoursesPage } from './pages/StudentCoursesPage.jsx';
import { StudentFavoritesPage } from './pages/StudentFavoritesPage.jsx';
import { StudentAcademyPage } from './pages/StudentAcademyPage.jsx';
import { StudentHomePage } from './pages/StudentHomePage.jsx';
import { StudentLearningPage } from './pages/StudentLearningPage.jsx';
import { StudentLocalCoursePage } from './pages/StudentLocalCoursePage.jsx';
import { StudentLocalPlayerPage } from './pages/StudentLocalPlayerPage.jsx';
import { StudentProgressPage } from './pages/StudentProgressPage.jsx';
import { StudentNotificationsPage } from './pages/StudentNotificationsPage.jsx';
import {
  StudentAccountSecurity,
  StudentProfileLayout,
  StudentPublicProfileForm,
  StudentPublicProfilePreview,
} from './pages/StudentProfilePage.jsx';
import { StudentsPage } from './pages/StudentsPage.jsx';
import { StudentEmpty } from './student/components.jsx';
import { useDocumentTitle } from './student/StudentData.jsx';

function NotFound() {
  return <ErrorState title="Page not found" message="That section is not part of the dashboard." />;
}

function StudentNotFound() {
  useDocumentTitle('Page not found');
  return (
    <StudentEmpty
      title="Page not found"
      message="That page is not part of your learning area."
      action={<Link to="/learn" className="btn-brand">Go to Home</Link>}
    />
  );
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
          <Route path="learn/academy" element={<StudentAcademyPage />} />
          <Route path="learn/courses" element={<StudentCoursesPage />} />
          <Route path="learn/courses/:slug" element={<StudentCourseDetailPage />} />
          <Route path="learn/courses/:slug/learn" element={<StudentCoursePlayerPage />} />
          <Route path="learn/my-courses/:courseId" element={<StudentLocalCoursePage />} />
          <Route path="learn/my-courses/:courseId/learn" element={<StudentLocalPlayerPage />} />
          <Route path="learn/cart" element={<StudentCartPage />} />
          <Route path="learn/favorites" element={<StudentFavoritesPage />} />
          <Route path="learn/checkout/:txRef" element={<StudentCheckoutPage />} />
          <Route path="learn/my-learning" element={<StudentLearningPage />} />
          <Route path="learn/progress" element={<StudentProgressPage />} />
          <Route path="learn/notifications" element={<StudentNotificationsPage />} />
          <Route path="learn/profile" element={<StudentProfileLayout />}>
            <Route index element={<StudentPublicProfileForm />} />
            <Route path="security" element={<StudentAccountSecurity />} />
            <Route path="public" element={<StudentPublicProfilePreview />} />
          </Route>
          <Route path="learn/*" element={<StudentNotFound />} />
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
