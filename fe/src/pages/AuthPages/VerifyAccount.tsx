import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import MediTechLogo from "../../components/common/MediTechLogo";
import authService from "../../services/authService";

export default function VerifyAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);

  const goToLogin = useCallback(() => navigate("/signin"), [navigate]);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("The verification link is invalid.");
      return;
    }

    authService
      .verifyAccount(token)
      .then((res) => {
        setStatus("success");
        setMessage(
          res.message || "Your account has been successfully verified. You can now log in and access the system."
        );
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.message || "The verification link is invalid or has expired."
        );
      });
  }, [searchParams]);

  // Auto-redirect countdown on success
  useEffect(() => {
    if (status !== "success") return;
    if (countdown <= 0) {
      goToLogin();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, goToLogin]);

  return (
    <>
      <PageMeta
        title="Account Verification | MediTech"
        description="Verify your MediTech account"
      />

      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-12 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl bg-white px-8 py-10 shadow-xl ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <MediTechLogo textSize="xl" />
            </div>

            {/* Loading */}
            {status === "loading" && (
              <div className="flex flex-col items-center py-4">
                <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Verifying your account...
                </p>
              </div>
            )}

            {/* Success */}
            {status === "success" && (
              <div className="flex flex-col items-center text-center">
                {/* Animated checkmark */}
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100 dark:bg-green-900/30 dark:ring-green-800/40">
                  <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white">
                  Account Verified Successfully
                </h2>
                <p className="mb-8 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {message}
                </p>

                <button
                  onClick={goToLogin}
                  className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Go to Login
                </button>

                <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                  Redirecting to login in {countdown} second{countdown !== 1 ? "s" : ""}...
                </p>
              </div>
            )}

            {/* Error */}
            {status === "error" && (
              <div className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 ring-4 ring-red-100 dark:bg-red-900/30 dark:ring-red-800/40">
                  <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white">
                  Verification Failed
                </h2>
                <p className="mb-8 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {message}
                </p>

                <button
                  onClick={goToLogin}
                  className="w-full rounded-xl bg-gray-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-offset-gray-800"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} MediTech. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
