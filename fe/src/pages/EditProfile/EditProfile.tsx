import { useCallback, useEffect, useRef, useState } from "react";
import ImageCropModal from "../../components/common/ImageCropModal";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import userService, { UserProfile, UpdateProfileRequest } from "../../services/userService";
import authService, { ChangePasswordRequest } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api").replace(/\/$/, "");

export default function EditProfile() {
  const { user, updateUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<UpdateProfileRequest>({
    fullName: "",
    phone: "",
    avatarUrl: "",
  });

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // Change Password state
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
        avatarUrl: data.avatarUrl || "",
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (field: keyof UpdateProfileRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedProfile = await userService.updateProfile(form);
      setProfile(updatedProfile);
      updateUserProfile({ avatarUrl: updatedProfile.avatarUrl, fullName: updatedProfile.fullName });
      setSuccess("Profile updated successfully!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (profile) {
      setForm({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
    setError(null);
    setSuccess(null);
  };

  const closeCropModal = () => {
    setCropModalOpen(false);
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Allowed: JPEG, PNG, GIF, WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setError(null);
    setSuccess(null);
    const url = URL.createObjectURL(file);
    setCropImageSrc(url);
    setCropModalOpen(true);
  };

  const handleAvatarCropped = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await userService.uploadAvatar(file);
      setForm((prev) => ({ ...prev, avatarUrl: result.avatarUrl }));
      setProfile((prev) => (prev ? { ...prev, avatarUrl: result.avatarUrl } : prev));
      updateUserProfile({ avatarUrl: result.avatarUrl });
      setSuccess("Avatar uploaded successfully!");
    } catch (err: unknown) {
      const ex = err as { response?: { data?: { message?: string } } };
      setError(ex.response?.data?.message || "Failed to upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  /** Resolve avatar URL — absolute URLs pass through, relative ones get the API origin prepended */
  const resolveAvatarUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const displayName = profile?.fullName || user?.email?.split("@")[0] || "User";
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

  const handlePasswordFieldChange = (field: keyof ChangePasswordRequest, value: string) => {
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

    setPasswordSaving(true);
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
      setPasswordSaving(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Edit Profile | MedicalTech Dashboard"
        description="Edit your profile - MedicalTech Medical Appointment System"
      />
      <PageBreadcrumb pageTitle="Edit Profile" />

      {/* Profile Header Card */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-col items-center gap-5 xl:flex-row">
          <div className="relative flex items-center justify-center w-20 h-20 overflow-hidden rounded-full border border-gray-200 dark:border-gray-800 bg-brand-100 dark:bg-brand-500/20">
            {profile?.avatarUrl ? (
              <img
                src={resolveAvatarUrl(profile.avatarUrl) || ""}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-full cursor-pointer"
              title="Change avatar"
            >
              {uploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarFileSelect}
              title="Upload avatar image"
            />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {displayName}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                {getRoleLabel(primaryRole)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {profile?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Editable Fields */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
              Personal Information
            </h4>
            <div className="space-y-5">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="Enter phone number (10-11 digits)"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  hint="Vietnamese format: 10-11 digits"
                />
              </div>
              <div>
                <Label htmlFor="avatar">Profile Picture</Label>
                <div className="mt-1 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    {form.avatarUrl ? (
                      <img
                        src={resolveAvatarUrl(form.avatarUrl) || ""}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition"
                    >
                      {uploading ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Choose Image
                        </>
                      )}
                    </button>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      JPEG, PNG, GIF, WebP — max 5MB
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Read-only Account Info */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
              Account Information
            </h4>
            <div className="space-y-5">
              <div>
                <Label>Email Address</Label>
                <Input type="text" value={profile?.email || ""} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Input type="text" value={getRoleLabel(primaryRole)} disabled />
              </div>
              <div>
                <Label>Account Status</Label>
                <div className="flex gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      profile?.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {profile?.isActive ? "Active" : "Inactive"}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      profile?.isVerified
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {profile?.isVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
              </div>
              <div>
                <Label>Two-Factor Authentication</Label>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    profile?.twoFactorEnabled
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {profile?.twoFactorEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div>
                <Label>Last Login</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile?.lastLogin
                    ? new Date(profile.lastLogin).toLocaleString("vi-VN")
                    : "Never"}
                </p>
              </div>
              <div>
                <Label>Member Since</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleString("vi-VN")
                    : "—"}
                </p>
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
                  onChange={(e) => handlePasswordFieldChange("currentPassword", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordFieldChange("newPassword", e.target.value)}
                  hint="At least 8 characters"
                />
              </div>
              <div>
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordFieldChange("confirmPassword", e.target.value)}
                />
              </div>
              <div className="pt-2">
                <Button size="sm" onClick={handleChangePassword} disabled={passwordSaving}>
                  {passwordSaving ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ImageCropModal
        open={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={closeCropModal}
        onCropped={handleAvatarCropped}
        aspect={1}
        title="Crop avatar"
      />
    </>
  );
}
