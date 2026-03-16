import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import authService from "../../services/authService";

const COUNTRY_CODES = [
  { code: "+84", label: "VietNam (+84)", dial: "84" },
  { code: "+1", label: "US / Canada (+1)", dial: "1" },
  { code: "+44", label: "UK (+44)", dial: "44" },
  { code: "+81", label: "Japan (+81)", dial: "81" },
  { code: "+82", label: "Korea (+82)", dial: "82" },
  { code: "+86", label: "China (+86)", dial: "86" },
  { code: "+65", label: "Singapore (+65)", dial: "65" },
  { code: "+66", label: "Thailand (+66)", dial: "66" },
  { code: "+61", label: "Australia (+61)", dial: "61" },
  { code: "+33", label: "France (+33)", dial: "33" },
  { code: "+49", label: "Germany (+49)", dial: "49" },
  { code: "+91", label: "India (+91)", dial: "91" },
  { code: "+60", label: "Malaysia (+60)", dial: "60" },
  { code: "+63", label: "Philippines (+63)", dial: "63" },
  { code: "+39", label: "Italy (+39)", dial: "39" },
  { code: "+34", label: "Spain (+34)", dial: "34" },
  { code: "+7", label: "Russia (+7)", dial: "7" },
  { code: "+55", label: "Brazil (+55)", dial: "55" },
  { code: "+971", label: "UAE (+971)", dial: "971" },
  { code: "+ other", label: "Other", dial: "" },
] as const;

const DEFAULT_COUNTRY = "+84";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

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

  const validatePassword = (pwd: string): string | null => {
    const pattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!pattern.test(pwd)) {
      return "Password must be at least 8 characters with uppercase, lowercase, number and special character (@$!%*?&#).";
    }
    return null;
  };

  const normalizePhoneDigits = (raw: string): string =>
    raw.replace(/\D/g, "").replace(/^0+/, "");

  const validatePhone = (
    countryCode: string,
    number: string
  ): string | null => {
    if (countryCode === "+ other") {
      const raw = number.trim();
      if (!raw) return null;
      if (!/^\+[1-9]\d{6,14}$/.test(raw.replace(/\s/g, "")))
        return "Enter full international number, e.g. +1 234 567 8901.";
      return null;
    }

    const digits = normalizePhoneDigits(number);
    if (!digits) return null;

    if (countryCode === "+84") {
      if (digits.length < 9 || digits.length > 10)
        return "Vietnamese number: 9–10 digits (e.g. 912 345 678).";
      if (!/^[3-9]/.test(digits))
        return "Vietnamese mobile should start with 3, 5, 7, 8, 9.";
      return null;
    }

    if (digits.length !== 10 && digits.length !== 11)
      return "Phone number should be 10–11 digits.";
    return null;
  };

  const getFullPhone = (): string | undefined => {
    if (phoneCountryCode === "+ other") {
      const raw = phoneNumber.trim().replace(/\s/g, "");
      return /^\+[1-9]\d{6,14}$/.test(raw) ? raw : undefined;
    }
    const digits = normalizePhoneDigits(phoneNumber);
    if (!digits) return undefined;
    const code = phoneCountryCode.replace("+", "");
    return `+${code}${digits}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setTermsError("");

    const emailErr = validateEmail(email);
    const missingPhone =
      phoneCountryCode === "+ other"
        ? !phoneNumber.trim()
        : !normalizePhoneDigits(phoneNumber);
    const missingPassword = !password;
    const missingConfirm = !confirmPassword;
    if (emailErr || missingPhone || missingPassword || missingConfirm) {
      setError("Please fill in all required fields.");
      if (emailErr) setEmailError(emailErr);
      if (missingPhone) setPhoneError("Please enter your phone number.");
      if (missingPassword) setPasswordError("Please enter your password.");
      if (missingConfirm) setConfirmPasswordError("Please confirm your password.");
      return;
    }

    if (!isChecked) {
      setError("Please agree to the Terms and Conditions.");
      setTermsError("Please agree to the Terms and Conditions.");
      return;
    }

    const pwdErr = validatePassword(password);
    if (pwdErr) {
      setError(pwdErr);
      setPasswordError(pwdErr);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    const phErr = validatePhone(phoneCountryCode, phoneNumber);
    if (phErr) {
      setError(phErr);
      setPhoneError(phErr);
      return;
    }

    const fullPhone = getFullPhone();

    setIsSubmitting(true);
    try {
      await authService.register({
        email,
        password,
        confirmPassword,
        phone: fullPhone,
      });
      // Registration success -> redirect to OTP verification page
      navigate("/verify-otp", { state: { email } });
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      const msg = axiosError.response?.data?.message ?? "";
      const isDuplicate =
        axiosError.response?.status === 409 ||
        msg.toLowerCase().includes("already registered");
      if (isDuplicate) {
        const warningText = "Email or phone number already exists.";
        setError(warningText);
        if (msg.toLowerCase().includes("email")) {
          setEmailError(warningText);
        }
        if (msg.toLowerCase().includes("phone")) {
          setPhoneError(warningText);
        }
        // If generic duplicate, highlight both
        if (!msg.toLowerCase().includes("email") && !msg.toLowerCase().includes("phone")) {
          setEmailError(warningText);
          setPhoneError(warningText);
        }
      } else if (msg) {
        setError(msg);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
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
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create your account to get started!
            </p>
          </div>
          <div>
            {error && (
              <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-5">
                {/* Email */}
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
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
                {/* Phone */}
                <div>
                  <Label>
                    Phone<span className="text-error-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <select
                      aria-label="Country code"
                      value={phoneCountryCode}
                      onChange={(e) => {
                        setPhoneCountryCode(e.target.value as typeof phoneCountryCode);
                        if (phoneError) setPhoneError("");
                      }}
                      className={`h-11 shrink-0 w-[140px] rounded-lg border bg-white px-3 py-2.5 text-sm shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/30 dark:bg-gray-900 dark:text-white/90 ${
                        phoneError
                          ? "border-error-500 focus:border-error-500 focus:ring-error-500/20"
                          : "border-gray-300 focus:border-brand-500 dark:border-gray-600"
                      }`}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder={
                        phoneCountryCode === "+84"
                          ? "912 345 678"
                          : phoneCountryCode === "+ other"
                            ? "+1 234 567 8901"
                            : "Phone number"
                      }
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (phoneError) setPhoneError("");
                      }}
                      className="flex-1 min-w-0"
                      error={!!phoneError}
                      hint={phoneError}
                    />
                  </div>
                  {!phoneError && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {phoneCountryCode === "+84"
                        ? "VietNam: 9–10 digits, e.g. 912 345 678."
                        : phoneCountryCode === "+ other"
                          ? "Enter full number with + and country code."
                          : "Enter number without leading 0."}
                    </p>
                  )}
                </div>
                {/* Password */}
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
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
                  {!passwordError && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      Min 8 chars with uppercase, lowercase, number &amp; special character.
                    </p>
                  )}
                </div>
                {/* Confirm Password */}
                <div>
                  <Label>
                    Confirm Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Confirm your password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordError) setConfirmPasswordError("");
                      }}
                      error={!!confirmPasswordError}
                      hint={confirmPasswordError}
                    />
                    <span
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                {/* Checkbox */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={(checked) => {
                      setIsChecked(checked);
                      if (termsError) setTermsError("");
                    }}
                  />
                  <div>
                    <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                      By creating an account means you agree to the{" "}
                      <span className="text-gray-800 dark:text-white/90">
                        Terms and Conditions,
                      </span>{" "}
                      and our{" "}
                      <span className="text-gray-800 dark:text-white">
                        Privacy Policy
                      </span>
                    </p>
                    {termsError && (
                      <p className="mt-1 text-xs text-error-500">{termsError}</p>
                    )}
                  </div>
                </div>
                {/* Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Creating account..." : "Sign Up"}
                  </button>
                </div>
              </div>
            </form>

            {/* Divider */}
            <div className="relative py-3 mt-5 sm:mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 text-gray-500 bg-white dark:bg-gray-900 dark:text-gray-400">
                  Or sign up with
                </span>
              </div>
            </div>

            {/* Google Sign Up Button */}
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
              Sign up with Google
            </a>

            {/* Facebook Sign Up Button */}
            <a
              href={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"}/auth/facebook/login`}
              className="flex items-center justify-center w-full gap-3 px-4 py-3 mt-3 text-sm font-medium text-white transition-colors bg-[#1877F2] border border-[#1877F2] rounded-lg hover:bg-[#166FE5]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Sign up with Facebook
            </a>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
