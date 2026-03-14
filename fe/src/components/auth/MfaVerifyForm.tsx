import { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router";
import authService from "../../services/authService";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";

export default function MfaVerifyForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuthFromToken } = useAuth();

  const state = (location.state as { email?: string; mfaToken?: string; rememberMe?: boolean }) || {};
  const email = state.email || "";
  const mfaToken = state.mfaToken || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const codeValue = useMemo(() => code.join(""), [code]);

  useEffect(() => {
    if (!email || !mfaToken) {
      navigate("/signin");
    }
  }, [email, mfaToken, navigate]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digits = value.replace(/\D/g, "");
    const next = [...code];

    // Support fast typing / autofill that may deliver multiple chars at once
    if (digits.length <= 1) {
      next[index] = digits;
      setCode(next);
      if (digits && index < 5) inputRefs.current[index + 1]?.focus();
      return;
    }

    for (let i = 0; i < digits.length && index + i < 6; i++) {
      next[index + i] = digits[i];
    }
    setCode(next);
    inputRefs.current[Math.min(index + digits.length, 5)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...code];
    for (let i = 0; i < pasted.length && i < 6; i++) next[i] = pasted[i];
    setCode(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
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
    if (codeValue.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const tokenData = await authService.verifyMfaLogin({ mfaToken, code: codeValue });
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
              Enter the 6-digit code from your Authenticator app.
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
              <div className="flex justify-center gap-3">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white transition-colors"
                    placeholder="-"
                    title={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              <div>
                <Button className="w-full" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Verifying..." : "Verify"}
                </Button>
              </div>

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

