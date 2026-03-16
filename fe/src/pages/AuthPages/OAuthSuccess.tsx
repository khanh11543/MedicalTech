import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { authStorage } from "../../utils/authStorage";
import PageMeta from "../../components/common/PageMeta";

/**
 * OAuth Success Page
 * Receives token data from backend redirect after Google OAuth2 login,
 * stores tokens, and redirects to the appropriate dashboard.
 */
export default function OAuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthFromToken } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const rolesParam = searchParams.get("roles");

    if (!accessToken || !refreshToken || !userId || !email || !rolesParam) {
      setError("Invalid OAuth response. Please try again.");
      setTimeout(() => navigate("/signin"), 3000);
      return;
    }

    const roles = rolesParam.split(",").filter(Boolean);

    // Store tokens using the remember-me pattern (persist across sessions for OAuth)
    authStorage.setRememberMe(true);

    // Set auth state via context
    setAuthFromToken({
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresAt: "", // Will be derived from JWT
      refreshExpiresAt: "",
      sessionKey: "",
      userId: parseInt(userId, 10),
      email,
      roles,
    });

    // Role-based redirect
    if (roles.includes("ADMIN")) {
      navigate("/admin", { replace: true });
    } else if (roles.includes("DOCTOR")) {
      navigate("/doctor", { replace: true });
    } else if (roles.includes("RECEPTIONIST")) {
      navigate("/receptionist/dashboard", { replace: true });
    } else {
      navigate("/home", { replace: true });
    }
  }, [searchParams, navigate, setAuthFromToken]);

  return (
    <>
      <PageMeta
        title="Signing in... | MediTech"
        description="Completing social sign-in"
      />
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          {error ? (
            <div className="p-4 text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          ) : (
            <>
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">
                Signing you in...
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
