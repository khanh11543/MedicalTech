import { useState, useEffect } from "react";
import userService, { type UserProfile } from "../../services/userService";
import patientService from "../../services/patientService";
import authService from "../../services/authService";
import { getAvatarUrl } from "../../utils/avatar";
import QRCode from "qrcode";

function maskPhone(phone: string) {
  if (!phone || phone.length < 7) return phone || "—";
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
  );
}

export default function PatientAccount() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [patientCccd, setPatientCccd] = useState<string | null>(null); // CCCD from patient profile (Medical Profile)
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [logoutAll, setLogoutAll] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // MFA (Authenticator) state
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false);
  const [mfaDisableOpen, setMfaDisableOpen] = useState(false);
  const [mfaQr, setMfaQr] = useState<string>("");
  const [mfaSecretInfo, setMfaSecretInfo] = useState<{ issuer: string; accountName: string; otpauthUrl: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [emailBackupCodesLoading, setEmailBackupCodesLoading] = useState(false);
  const [emailBackupCodesMessage, setEmailBackupCodesMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCccd, setShowCccd] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      userService.getProfile().then((data) => {
        setProfile(data);
      }).catch(() => {}),
      patientService.getMyProfile().then((data) => {
        setPatientCccd(data.idNumber ?? null);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const refreshProfile = async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data);
    } catch {
      // ignore
    }
  };

  const handleStartMfaSetup = async () => {
    setMfaError(null);
    setBackupCodes(null);
    setEmailBackupCodesMessage(null);
    setMfaCode("");
    setMfaQr("");
    setMfaSecretInfo(null);
    setMfaLoading(true);
    try {
      const setup = await authService.mfaSetup();
      setMfaSecretInfo({ issuer: setup.issuer, accountName: setup.accountName, otpauthUrl: setup.otpauthUrl });
      const dataUrl = await QRCode.toDataURL(setup.otpauthUrl, { margin: 1, width: 220 });
      setMfaQr(dataUrl);
      setMfaSetupOpen(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to start MFA setup.";
      setMfaError(msg);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleEnableMfa = async () => {
    if (!/^\d{6}$/.test(mfaCode)) {
      setMfaError("Please enter a valid 6-digit code.");
      return;
    }
    setMfaError(null);
    setMfaLoading(true);
    try {
      const res = await authService.mfaEnable(mfaCode);
      setBackupCodes(res.backupCodes || []);
      await refreshProfile();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to enable MFA.";
      setMfaError(msg);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!/^\d{6}$/.test(mfaCode)) {
      setMfaError("Please enter a valid 6-digit code.");
      return;
    }
    setMfaError(null);
    setMfaLoading(true);
    try {
      await authService.mfaDisable(mfaCode);
      setMfaDisableOpen(false);
      setMfaCode("");
      await refreshProfile();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to disable MFA.";
      setMfaError(msg);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword) return;
    setChangingPassword(true);
    setPasswordMsg(null);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to change password.";
      setPasswordMsg({ type: "error", text: msg });
    } finally {
      setChangingPassword(false);
    }
  };

  // Password strength
  const getStrength = (pw: string): { level: number; label: string; color: string } => {
    if (!pw) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
    if (score === 2) return { level: 2, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { level: 3, label: "Good", color: "bg-[#049ebb]" };
    return { level: 4, label: "Strong", color: "bg-emerald-500" };
  };
  const strength = getStrength(newPassword);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-72 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const userName = profile?.fullName || profile?.email || "User";
  const userEmail = profile?.email || "";
  const userPhone = profile?.phone || "";
  const userJoinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "";
  const userCccd = patientCccd ?? ""; // CCCD from patient profile (updated in Medical Profile)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Account & Security</h2>
        <p className="text-sm text-gray-400 mt-1">Manage your account information and security settings</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Account Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#049ebb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Account Information
          </h4>
          <div className="flex flex-col items-center mb-4 pb-4 border-b border-gray-100">
            {profile?.avatarUrl ? (
              <img src={getAvatarUrl(profile.avatarUrl) ?? ""} alt={userName} className="w-16 h-16 rounded-full object-cover shadow-md shadow-[#049ebb]/20 mb-2" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#049ebb] to-[#027a94] flex items-center justify-center text-white text-xl font-bold shadow-md shadow-[#049ebb]/20 mb-2">
                {userName.charAt(0)}
              </div>
            )}
            <h5 className="text-sm font-semibold text-gray-900">{userName}</h5>
            {userJoinDate && <p className="text-xs text-gray-400">Member since {userJoinDate}</p>}
          </div>
          <div className="space-y-2">
            <InfoField label="Email" value={userEmail} icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
            <InfoField label="Phone" value={maskPhone(userPhone)} icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>} />
          </div>
        </div>

        {/* Identity Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#049ebb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
            Identity Information
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 px-3.5 bg-gray-50 rounded-xl">
              <div>
                <p className="text-[11px] text-gray-400 mb-0.5">ID Number (CCCD)</p>
                <p className="text-sm font-medium text-gray-900 font-mono tracking-wide">
                  {userCccd ? (showCccd ? userCccd : "••••••••") : "Not set"}
                </p>
              </div>
              {userCccd && (
                <button
                  type="button"
                  onClick={() => setShowCccd((prev) => !prev)}
                  className="p-2 rounded-lg text-gray-400 hover:text-[#049ebb] hover:bg-[#049ebb]/10 transition-all bg-transparent border-none cursor-pointer"
                  title={showCccd ? "Hide ID number" : "Show last 4 digits"}
                >
                  <EyeIcon open={showCccd} />
                </button>
              )}
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs text-blue-700 leading-relaxed">Your ID number is stored as a hash in the database. Only the last 4 digits are shown for reference. Update it in Medical Profile if needed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#049ebb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Security
        </h4>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} show={showCurrentPw} onToggle={() => setShowCurrentPw(!showCurrentPw)} placeholder="Enter current password" />
          <div>
            <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} show={showNewPw} onToggle={() => setShowNewPw(!showNewPw)} placeholder="Enter new password" />
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.level ? strength.color : "bg-gray-200"}`} />
                  ))}
                </div>
                <p className={`text-[10px] font-medium ${strength.level <= 1 ? "text-red-500" : strength.level === 2 ? "text-amber-500" : strength.level === 3 ? "text-[#049ebb]" : "text-emerald-500"}`}>{strength.label}</p>
              </div>
            )}
          </div>
          <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPw} onToggle={() => setShowConfirmPw(!showConfirmPw)} placeholder="Confirm new password" error={confirmPassword && confirmPassword !== newPassword ? "Passwords do not match" : undefined} />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={logoutAll} onChange={(e) => setLogoutAll(e.target.checked)} className="w-4 h-4 text-[#049ebb] border-gray-300 rounded focus:ring-[#049ebb] accent-[#049ebb] cursor-pointer" />
            <span className="text-xs text-gray-600">Log out from all other devices</span>
          </label>
          <div className="flex items-center gap-3">
            {passwordMsg && (
              <p className={`text-xs font-medium ${passwordMsg.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                {passwordMsg.text}
              </p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || changingPassword}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#049ebb] rounded-xl hover:bg-[#037a94] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#049ebb]/20 border-none cursor-pointer"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#049ebb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 19v-1a4 4 0 014-4h4a4 4 0 014 4v1" />
              </svg>
              Authenticator (Two-Factor Authentication)
            </h4>
            <p className="text-xs text-gray-500">
              Use an Authenticator app (Google Authenticator, Microsoft Authenticator, Authy) to secure your account.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {profile?.twoFactorEnabled ? (
              <>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Enabled
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMfaError(null);
                    setMfaCode("");
                    setBackupCodes(null);
                    setEmailBackupCodesMessage(null);
                    setMfaDisableOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all shadow-md shadow-red-500/20 border-none cursor-pointer disabled:opacity-50"
                  disabled={mfaLoading}
                >
                  Disable
                </button>
              </>
            ) : (
              <>
                <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-200">
                  Disabled
                </span>
                <button
                  type="button"
                  onClick={handleStartMfaSetup}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#049ebb] rounded-xl hover:bg-[#037a94] transition-all shadow-md shadow-[#049ebb]/20 border-none cursor-pointer disabled:opacity-50"
                  disabled={mfaLoading}
                >
                  {mfaLoading ? "Loading..." : "Enable"}
                </button>
              </>
            )}
          </div>
        </div>

        {mfaError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {mfaError}
          </div>
        )}

        {backupCodes && backupCodes.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-900 mb-2">Backup codes (save these now)</p>
            <p className="text-[11px] text-amber-800 mb-3">
              These codes are shown once. Store them somewhere safe. Each code can be used once if you lose access to your Authenticator.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {backupCodes.map((c) => (
                <div key={c} className="font-mono text-xs bg-white border border-amber-200 rounded-lg px-3 py-2 text-amber-900">
                  {c}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = "MedicalTech – Two-Factor Backup Codes\n\nSave these codes. Each can be used once to sign in if you lose your Authenticator app.\n\n" + backupCodes.join("\n");
                  const blob = new Blob([text], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "MedicalTech-backup-codes.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-900 bg-white border border-amber-300 rounded-xl hover:bg-amber-50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download to device
              </button>
              <button
                type="button"
                disabled={emailBackupCodesLoading}
                onClick={async () => {
                  setEmailBackupCodesMessage(null);
                  setEmailBackupCodesLoading(true);
                  try {
                    await authService.emailBackupCodes(backupCodes);
                    setEmailBackupCodesMessage({ type: "success", text: "Backup codes sent to your email." });
                  } catch (err: unknown) {
                    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to send email.";
                    setEmailBackupCodesMessage({ type: "error", text: msg });
                  } finally {
                    setEmailBackupCodesLoading(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-900 bg-white border border-amber-300 rounded-xl hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {emailBackupCodesLoading ? "Sending..." : "Send to my email"}
              </button>
            </div>
            {emailBackupCodesMessage && (
              <p className={`mt-2 text-xs ${emailBackupCodesMessage.type === "success" ? "text-green-700" : "text-red-700"}`}>
                {emailBackupCodesMessage.text}
              </p>
            )}
          </div>
        )}
      </div>

      {/* MFA Setup Modal */}
      {mfaSetupOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Set up Authenticator</h3>
              <button
                onClick={() => {
                  setMfaSetupOpen(false);
                  setMfaCode("");
                  setMfaError(null);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all bg-transparent border-none cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-600">
                Scan this QR code with your Authenticator app, then enter the 6-digit code to confirm.
              </p>

              {mfaSecretInfo && (
                <div className="text-[11px] text-gray-500">
                  <div><span className="font-medium text-gray-700">Issuer:</span> {mfaSecretInfo.issuer}</div>
                  <div><span className="font-medium text-gray-700">Account:</span> {mfaSecretInfo.accountName}</div>
                </div>
              )}

              <div className="flex justify-center">
                {mfaQr ? (
                  <img src={mfaQr} alt="MFA QR" className="w-[220px] h-[220px] rounded-xl border border-gray-200 bg-white p-2" />
                ) : (
                  <div className="w-[220px] h-[220px] rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">6-digit code</label>
                <input
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb] font-mono tracking-widest"
                />
              </div>

              {mfaError && <p className="text-xs text-red-600">{mfaError}</p>}
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button
                onClick={() => {
                  setMfaSetupOpen(false);
                  setMfaCode("");
                  setMfaError(null);
                }}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={mfaLoading || !/^\d{6}$/.test(mfaCode)}
                onClick={handleEnableMfa}
                className="px-4 py-2 text-xs font-medium text-white bg-[#049ebb] rounded-xl hover:bg-[#037a94] disabled:opacity-50 disabled:cursor-not-allowed transition-all border-none cursor-pointer"
              >
                {mfaLoading ? "Enabling..." : "Enable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MFA Disable Modal */}
      {mfaDisableOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Disable Authenticator</h3>
              <button
                onClick={() => {
                  setMfaDisableOpen(false);
                  setMfaCode("");
                  setMfaError(null);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all bg-transparent border-none cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-600">
                Enter the 6-digit code from your Authenticator app to disable MFA.
              </p>
              <input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb] font-mono tracking-widest"
              />
              {mfaError && <p className="text-xs text-red-600">{mfaError}</p>}
            </div>

            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button
                onClick={() => {
                  setMfaDisableOpen(false);
                  setMfaCode("");
                  setMfaError(null);
                }}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={mfaLoading || !/^\d{6}$/.test(mfaCode)}
                onClick={handleDisableMfa}
                className="px-4 py-2 text-xs font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all border-none cursor-pointer"
              >
                {mfaLoading ? "Disabling..." : "Disable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Small helpers ─── */
function InfoField({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3.5 bg-gray-50 rounded-xl">
      <div className="text-gray-400">{icon}</div>
      <div>
        <p className="text-[11px] text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string; error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#049ebb]/30 focus:border-[#049ebb] ${error ? "border-red-300" : "border-gray-200"}`}
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0">
          <EyeIcon open={show} />
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
