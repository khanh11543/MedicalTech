import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function AdminProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

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

  // Check if user has ADMIN role
  const hasAdminRole = user?.roles?.includes("ADMIN");

  if (!hasAdminRole) {
    // Redirect non-admin users based on role
    const hasDoctorRole = user?.roles?.includes("DOCTOR");
    return <Navigate to={hasDoctorRole ? "/doctor" : "/home"} replace />;
  }

  return <Outlet />;
}
