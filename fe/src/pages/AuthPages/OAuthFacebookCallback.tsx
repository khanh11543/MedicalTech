import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { authStorage } from "../../utils/authStorage";
import api from "../../services/api";
import PageMeta from "../../components/common/PageMeta";

/**
 * Facebook OAuth Callback Page
 * Facebook redirects here with ?code=xxx
 * React sends the code to backend, receives JWT tokens, stores them and redirects.
 */
export default function OAuthFacebookCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthFromToken } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("Facebook login was cancelled or failed.");
      setTimeout(() => navigate("/signin"), 3000);
      return;
    }

    // Send code to backend
    api
      .post("/auth/facebook/callback", { code })
      .then((res) => {
        const tokenData = res.data;

        // Store tokens (persist for OAuth)
        authStorage.setRememberMe(true);

        setAuthFromToken({
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          tokenType: "Bearer",
          expiresAt: tokenData.expiresAt || "",
          refreshExpiresAt: tokenData.refreshExpiresAt || "",
          sessionKey: tokenData.sessionKey || "",
          userId: tokenData.userId,
          email: tokenData.email,
          roles: Array.isArray(tokenData.roles)
            ? tokenData.roles
            : Array.from(tokenData.roles || []),
        });

        // Role-based redirect
        const roles: string[] = Array.isArray(tokenData.roles)
          ? tokenData.roles
          : Array.from(tokenData.roles || []);

        if (roles.includes("ADMIN")) {
          navigate("/admin", { replace: true });
        } else if (roles.includes("DOCTOR")) {
          navigate("/doctor", { replace: true });
        } else if (roles.includes("RECEPTIONIST")) {
          navigate("/receptionist/dashboard", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message || "Facebook login failed. Please try again.";
        setError(msg);
        setTimeout(() => navigate("/signin"), 3000);
      });
  }, [searchParams, navigate, setAuthFromToken]);

  return (
    <>
      <PageMeta
        title="Signing in... | MediTech"
        description="Completing Facebook sign-in"
      />
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          {error ? (
            <div className="p-4 text-red-600 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          ) : (
            <>
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">
                Signing you in with Facebook...
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
