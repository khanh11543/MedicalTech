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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

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

    if (digits.length < 7 || digits.length > 15)
      return "Phone number should be 7–15 digits.";
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

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isChecked) {
      setError("Please agree to the Terms and Conditions.");
      return;
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const phoneError = validatePhone(phoneCountryCode, phoneNumber);
    if (phoneError) {
      setError(phoneError);
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
      if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
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
            <form onSubmit={handleSubmit}>
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
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {/* Phone */}
                <div>
                  <Label>Phone (optional)</Label>
                  <div className="flex gap-2">
                    <select
                      aria-label="Country code"
                      value={phoneCountryCode}
                      onChange={(e) =>
                        setPhoneCountryCode(e.target.value as typeof phoneCountryCode)
                      }
                      className="h-11 shrink-0 w-[140px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-theme-xs focus:outline-none focus:ring-3 focus:ring-brand-500/30 focus:border-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white/90"
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
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 min-w-0"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {phoneCountryCode === "+84"
                      ? "VietNam: 9–10 digits, e.g. 912 345 678."
                      : phoneCountryCode === "+ other"
                        ? "Enter full number with + and country code."
                        : "Enter number without leading 0."}
                  </p>
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
                      onChange={(e) => setPassword(e.target.value)}
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
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Min 8 chars with uppercase, lowercase, number &amp; special character.
                  </p>
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
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                    onChange={setIsChecked}
                  />
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
