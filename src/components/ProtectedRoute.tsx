/**
 * ProtectedRoute
 *
 * Wraps a route and redirects unauthenticated users to the appropriate auth page.
 * Uses `useUser()` from UserContext to check session state.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** Which login page to redirect to when unauthenticated. Defaults to /student-auth */
    redirectTo?: string;
}

export function ProtectedRoute({
    children,
    redirectTo = '/student-auth',
}: ProtectedRouteProps) {
    const { userData } = useUser();
    const location = useLocation();

    // Determine if there's a valid session token
    const token =
        userData?.data?.session?.access_token ||
        userData?.session?.access_token;

    if (!token) {
        // Preserve the intended URL so we can redirect back after login, if desired
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
