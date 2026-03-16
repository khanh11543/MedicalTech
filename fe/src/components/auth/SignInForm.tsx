import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { authStorage } from "../../utils/authStorage";

function parseLockUntil(message: string): Date | null {
  // Match ISO datetime like "2026-03-15T05:35:00" from error message
  const match = message.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
  if (match) {
    const date = new Date(match[1]);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SignInForm() {
  const rememberedEmail = authStorage.getRememberedEmail();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(!!rememberedEmail);
  const [email, setEmail] = useState(rememberedEmail || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockUntil, setLockUntil] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Countdown timer effect
  useEffect(() => {
    if (!lockUntil) {
      setCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((lockUntil.getTime() - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setLockUntil(null);
        setError("");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  const isLocked = countdown > 0;

  const validateEmail = (value: string): string | null => {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) return "Please enter your email.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      if (trimmed.includes("@") && !trimmed.split("@")[1]?.includes("."))
        return "Please enter a part following '@'. Email is incomplete.";
      return "Please enter a valid email address.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setError("");
    setEmailError("");
    setPasswordError("");

    const emailErr = validateEmail(email);
    const missingPassword = !password?.trim();
    if (emailErr || missingPassword) {
      setError(emailErr || "Please enter both email and password.");
      if (emailErr) setEmailError(emailErr);
      if (missingPassword) setPasswordError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(
        {
          email,
          password,
          deviceId: navigator.userAgent,
          deviceName: `Web Browser - ${navigator.platform}`,
        },
        isChecked
      );

      if (res.mfaRequired) {
        navigate("/mfa-verify", {
          state: {
            email,
            mfaToken: res.mfaToken,
            rememberMe: isChecked,
          },
        });
        return;
      }

      const tokenData = res.token!;
      if (isChecked) {
        authStorage.setRememberedEmail(email);
      } else {
        authStorage.clearRememberedEmail();
      }

      // Role-based redirect
      if (tokenData.roles?.includes("ADMIN")) {
        navigate("/admin");
      } else if (tokenData.roles?.includes("DOCTOR")) {
        navigate("/doctor");
      } else if (tokenData.roles?.includes("RECEPTIONIST")) {
        navigate("/receptionist/dashboard");
      } else {
        navigate("/home");
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      const status = axiosError.response?.status;
      const serverMessage = axiosError.response?.data?.message || "";

      if (status === 429) {
        // Account locked or IP blocked
        const until = parseLockUntil(serverMessage);
        if (until) {
          setLockUntil(until);
        }
        if (serverMessage.includes("IP")) {
          setError("Too many failed login attempts. Please try again later.");
        } else {
          setError("The account has been temporarily locked due to too many incorrect entries.");
        }
      } else if (serverMessage) {
        setError(serverMessage);
      } else if (status === 401) {
        setError("Invalid email or password.");
      } else if (status === 423) {
        setError("Account is locked. Please try again later.");
      } else {
        setError("Login failed. Please check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to home
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            {error && (
              <div className={`p-3 mb-4 text-sm rounded-lg border ${
                isLocked
                  ? "text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400"
                  : "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              }`}>
                <div>{error}</div>
                {isLocked && (
                  <div className="mt-1 font-semibold">
                    Try again later: {formatCountdown(countdown)}
                  </div>
                )}
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    error={!!emailError}
                    hint={emailError}
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      error={!!passwordError}
                      hint={passwordError}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={isSubmitting || isLocked}>
                    {isLocked
                      ? `Locked (${formatCountdown(countdown)})`
                      : isSubmitting
                        ? "Signing in..."
                        : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <a
              href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}/auth/google/login`}
              className="flex items-center justify-center w-full gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </a>

            {/* Facebook Login Button */}
            <a
              href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}/auth/facebook/login`}
              className="flex items-center justify-center w-full gap-3 px-4 py-3 mt-3 text-sm font-medium text-white transition-colors bg-[#1877F2] border border-[#1877F2] rounded-lg hover:bg-[#166FE5]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Sign in with Facebook
            </a>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account?{" "}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
