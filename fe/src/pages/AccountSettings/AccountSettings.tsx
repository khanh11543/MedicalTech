import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import authService, { ChangePasswordRequest } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

export default function AccountSettings() {
  const { user, logout } = useAuth();

  // Change password state
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const primaryRole = user?.roles?.[0]?.replace("ROLE_", "") || "User";

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Administrator";
      case "DOCTOR": return "Doctor";
      case "PATIENT": return "Patient";
      case "RECEPTIONIST": return "Receptionist";
      default: return role;
    }
  };

  const handlePasswordChange = (field: keyof ChangePasswordRequest, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Please fill in all password fields");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirmation do not match");
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await authService.changePassword(passwordForm);
      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setPasswordError(e.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    logout();
  };

  return (
    <>
      <PageMeta
        title="Account Settings | MedicalTech Dashboard"
        description="Account settings - MedicalTech Medical Appointment System"
      />
      <PageBreadcrumb pageTitle="Account Settings" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Overview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            Account Overview
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.email || "—"}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Verified
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {getRoleLabel(primaryRole)}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                {primaryRole}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">User ID</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  #{user?.userId || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            Change Password
          </h4>

          {passwordError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
              {passwordSuccess}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                hint="At least 8 characters"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
              />
            </div>
            <div className="pt-2">
              <Button size="sm" onClick={handleChangePassword} disabled={passwordLoading}>
                {passwordLoading ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
          <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            Security
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Add an extra layer of security to your account
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                Coming Soon
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Active Sessions
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage devices where you are signed in
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-red-200 bg-white p-5 dark:border-red-900/50 dark:bg-white/[0.03] lg:p-6">
          <h4 className="mb-6 text-lg font-semibold text-red-600 dark:text-red-400">
            Danger Zone
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 dark:bg-red-900/10">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Sign Out
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Sign out from this device
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
