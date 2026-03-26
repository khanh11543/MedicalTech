import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import authService from "../../services/authService";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { authStorage } from "../../utils/authStorage";

/** Accept 6-digit TOTP or alphanumeric backup code (8–32 chars). */
const isValidCode = (value: string): boolean => {
  const trimmed = value.trim();
  return /^[0-9]{6}$/.test(trimmed) || /^[A-Za-z0-9]{8,32}$/.test(trimmed);
};

export default function MfaVerifyForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthFromToken } = useAuth();

  const state = (location.state as { email?: string; mfaToken?: string; rememberMe?: boolean }) || {};
  const email = state.email || "";
  const mfaToken = state.mfaToken || "";

  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!email || !mfaToken) {
      navigate("/signin");
    }
  }, [email, mfaToken, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^[A-Za-z0-9]*$/.test(value)) {
      setCode(value);
      setError("");
    }
  };

  const redirectByRole = (roles: string[]) => {
    if (roles?.includes("ADMIN")) navigate("/admin");
    else if (roles?.includes("DOCTOR")) navigate("/doctor");
    else if (roles?.includes("RECEPTIONIST")) navigate("/receptionist/dashboard");
    else navigate("/home");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Please enter your 6-digit Authenticator code or backup code.");
      return;
    }
    if (!isValidCode(trimmed)) {
      setError("Enter a 6-digit code from your Authenticator app, or a backup code (8–32 letters and numbers).");
      return;
    }

    setIsSubmitting(true);
    try {
      const tokenData = await authService.verifyMfaLogin({
        mfaToken,
        code: trimmed,
        rememberDevice,
        deviceId: authStorage.getOrCreateDeviceId(),
      });
      if (tokenData.trustedDeviceToken) {
        authStorage.setTrustedDeviceToken(tokenData.trustedDeviceToken);
      }
      setAuthFromToken(tokenData);
      redirectByRole(tokenData.roles || []);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-brand-50 rounded-full dark:bg-brand-500/10">
                <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 19v-1a4 4 0 014-4h4a4 4 0 014 4v1" />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Two-Factor Verification
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the 6-digit code from your Authenticator app, or a backup code.
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{email}</p>
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="mfa-code" className="sr-only">
                  Verification code
                </label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="text"
                  autoComplete="one-time-code"
                  maxLength={32}
                  value={code}
                  onChange={handleChange}
                  placeholder="6-digit code or backup code"
                  className="w-full h-14 px-4 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors font-mono tracking-wider"
                  title="Enter 6-digit Authenticator code or backup code"
                />
              </div>

              <div>
                <Button className="w-full" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Verifying..." : "Verify"}
                </Button>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 justify-center">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                />
                Remember this device for 7 days
              </label>

              <div className="text-center">
                <Link to="/signin" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  &larr; Back to Sign In
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
