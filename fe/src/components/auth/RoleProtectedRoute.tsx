import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface RoleProtectedRouteProps {
  allowedRoles: string[];
}

export default function RoleProtectedRoute({
  allowedRoles,
}: RoleProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  const userRoles = user?.roles || [];
  const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
          You do not have permission to access this page. Please contact the administrator
          if you need access.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <Outlet />;
}
