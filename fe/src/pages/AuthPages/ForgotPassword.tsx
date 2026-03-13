import { useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import authService from "../../services/authService";
import { ChevronLeftIcon } from "../../icons";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setSuccess(true);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string }; status?: number };
      };
      if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError("Request failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Forgot password | MediTech"
        description="Recover password via email - MediTech"
      />
      <AuthLayout>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="w-full max-w-md pt-10 mx-auto">
            <Link
              to="/signin"
              className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ChevronLeftIcon className="size-5" />
              Back to sign in
            </Link>
          </div>
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Forgot password?
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your registered email. We will send a new password to your inbox. It is valid for 15 minutes — then sign in and go to Profile to change your password.
              </p>
            </div>

            {success ? (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                  A new password has been sent to your email.
                </p>
                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                  The password is valid for <strong>15 minutes</strong>. Sign in with your email and the password from the email, then go to <strong>Profile / Account settings</strong> to change it.
                </p>
                <Link
                  to="/signin"
                  className="inline-block mt-4 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  Go to sign in →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    {error}
                  </div>
                )}
                <div className="space-y-6">
                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      placeholder="Enter your registered email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send new password"}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6">
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                Remember your password?{" "}
                <Link
                  to="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
