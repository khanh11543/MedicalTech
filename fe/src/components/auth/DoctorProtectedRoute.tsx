import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { DoctorVerificationProvider, useDoctorVerificationContext } from "../../context/DoctorVerificationContext";

// Paths that non-verified doctors CAN access
const UNVERIFIED_ALLOWED_PATHS = [
  "/doctor/profile-setup",
  "/doctor/verification-center",
  "/doctor/profile",
  "/doctor/edit-profile",
  "/doctor/account-settings",
  "/doctor/support",
];

function DoctorVerificationGate() {
  const { isVerified, isLoading } = useDoctorVerificationContext();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentPath = location.pathname;
  const isAllowedPath = UNVERIFIED_ALLOWED_PATHS.some(
    (path) => currentPath === path || currentPath.startsWith(path + "/")
  );

  // Non-verified doctor trying to access a clinical page → redirect to verification center
  if (!isVerified && !isAllowedPath) {
    return <Navigate to="/doctor/verification-center" replace />;
  }

  return <Outlet />;
}

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
    const hasAdminRole = user?.roles?.includes("ADMIN");
    return <Navigate to={hasAdminRole ? "/admin" : "/patient"} replace />;
  }

  return (
    <DoctorVerificationProvider>
      <DoctorVerificationGate />
    </DoctorVerificationProvider>
  );
}
