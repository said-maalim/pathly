/**
 * App.tsx
 *
 * Root of the application. Uses React Router v6 BrowserRouter + Routes to map
 * URL paths to page components. Navigation is exposed as an `onNavigate(page)`
 * callback so existing component signatures don't need to change.
 *
 * Auth state is managed in UserContext (src/context/UserContext.tsx) and is
 * accessible to any route without prop drilling.
 *
 * Route guard:
 *   /student-portal  → requires session token → else redirects to /student-auth
 *   /dso-portal      → requires session token → else redirects to /dso-auth
 */
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner@2.0.3';
import { UserProvider, useUser } from './context/UserContext';

// Page components
import { LandingPage } from './components/LandingPage';
import { UniversityPortal } from './components/UniversityPortal';
import { UniversityStudentPortal } from './components/UniversityStudentPortal';
import { UniversityDSOPortal } from './components/UniversityDSOPortal';
import { UniversityChoice } from './components/UniversityChoice';
import { StudentAuth } from './components/StudentAuth';
import { DSOAuth } from './components/DSOAuth';
import { RequestCenterPage } from './components/RequestCenterPage';
import { IntegrationTest } from './components/IntegrationTest';
import { QuickTest } from './components/QuickTest';
import CleanupUtility from './CleanupUtility';
import { ProtectedRoute } from './components/ProtectedRoute';

// ─── Page-key → URL path mapping ──────────────────────────────────────────────
// Keeps existing onNavigate('page-key') calls working without modifying components.

const PAGE_PATHS: Record<string, string> = {
  landing: '/',
  'university-choice': '/university-choice',
  'student-auth': '/student-auth',
  'dso-auth': '/dso-auth',
  'student-portal': '/student-portal',
  'dso-portal': '/dso-portal',
  university: '/university',
  'request-center': '/request-center',
  'quick-test': '/quick-test',
  'integration-test': '/integration-test',
  'cleanup-utility': '/cleanup-utility',
};

// ─── Inner router component (must be inside BrowserRouter to use useNavigate) ─

function RouterApp() {
  const routerNavigate = useNavigate();
  const { userData, setUserData } = useUser();

  /** Drop-in replacement for the old `setCurrentPage` navigate function. */
  const navigate = (page: string) => {
    const path = PAGE_PATHS[page] ?? '/';
    routerNavigate(path);
  };

  const handleUserLogin = (user: unknown) => {
    setUserData(user as Parameters<typeof setUserData>[0]);
  };

  const handleLogout = (redirectPage: string) => {
    setUserData(null);
    navigate(redirectPage);
  };

  /** Derived user display name for sub-portals */
  const userName =
    (userData?.data as { user?: { user_metadata?: { name?: string } } })?.user
      ?.user_metadata?.name ?? 'Student';

  return (
    <>
      <Routes>
        {/* ── Public routes ──────────────────────────────────────────────── */}
        <Route
          path="/"
          element={<LandingPage onNavigate={navigate} />}
        />
        <Route
          path="/university-choice"
          element={<UniversityChoice onNavigate={navigate} />}
        />
        <Route
          path="/student-auth"
          element={<StudentAuth onNavigate={navigate} onLogin={handleUserLogin} />}
        />
        <Route
          path="/dso-auth"
          element={<DSOAuth onNavigate={navigate} onLogin={handleUserLogin} />}
        />
        <Route
          path="/university"
          element={<UniversityPortal onNavigate={navigate} />}
        />
        <Route
          path="/quick-test"
          element={<QuickTest onNavigate={navigate} />}
        />
        <Route
          path="/integration-test"
          element={<IntegrationTest onBack={() => navigate('landing')} />}
        />
        <Route
          path="/cleanup-utility"
          element={<CleanupUtility />}
        />
        <Route
          path="/request-center"
          element={
            <RequestCenterPage
              onNavigate={navigate}
              onSubmit={(data) => console.log('Request submitted:', data)}
            />
          }
        />
        {/* ── Protected routes ────────────────────────────────────────────── */}
        <Route
          path="/student-portal"
          element={
            <ProtectedRoute redirectTo="/student-auth">
              <UniversityStudentPortal
                onNavigate={navigate}
                onLogout={() => handleLogout('student-auth')}
                userData={userData}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dso-portal"
          element={
            <ProtectedRoute redirectTo="/dso-auth">
              <UniversityDSOPortal
                onNavigate={navigate}
                onLogout={() => handleLogout('dso-auth')}
                userData={userData}
              />
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all ──────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster position="top-right" richColors />
    </>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <RouterApp />
      </UserProvider>
    </BrowserRouter>
  );
}