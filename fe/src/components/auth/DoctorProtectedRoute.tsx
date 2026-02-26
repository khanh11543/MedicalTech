import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

export default function DoctorProtectedRoute() {
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

    // Check if user has DOCTOR role
    const hasDoctorRole = user?.roles?.includes("DOCTOR");

    if (!hasDoctorRole) {
        // Redirect non-doctor users to appropriate dashboard
        const hasAdminRole = user?.roles?.includes("ADMIN");
        return <Navigate to={hasAdminRole ? "/admin" : "/patient"} replace />;
    }

    return <Outlet />;
}
