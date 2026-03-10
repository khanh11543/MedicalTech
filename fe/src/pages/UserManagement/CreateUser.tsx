import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import adminService from "../../services/adminService";

// ============== TYPES ==============
interface RoleOption {
  id: number;
  name: string;
}

interface FormData {
  role: string;
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
  // Doctor-specific
  specialization: string;
  subSpecialization: string;
  yearsOfExperience: string;
  qualification: string;
  notes: string;
  sendInvite: boolean;
}

interface FormErrors {
  [key: string]: string;
}

interface CreatedUser {
  id: number;
  email: string;
  roles: string[];
}

const SPECIALIZATIONS = [
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "General Practice",
  "Gynecology",
  "Hematology",
  "Internal Medicine",
  "Nephrology",
  "Neurology",
  "Obstetrics",
  "Oncology",
  "Ophthalmology",
  "Orthopedics",
  "Otolaryngology (ENT)",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Surgery",
  "Urology",
];

const generatePassword = (): string => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "@#$%^&+=";
  const all = upper + lower + digits + special;

  let password = "";
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

export default function CreateUser() {
  const { toast, showToast, dismissToast } = useToast();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [inviteStatus, setInviteStatus] = useState<"sent" | "failed" | "not_sent" | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    role: "",
    fullName: "",
    email: "",
    phone: "",
    isActive: true,
    specialization: "",
    subSpecialization: "",
    yearsOfExperience: "",
    qualification: "",
    notes: "",
    sendInvite: true,
  });

  useEffect(() => {
    adminService.getRoles().then(setRoles).catch(console.error);
  }, []);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setApiError(null);
  };

  const isDoctor = form.role === "DOCTOR";

  const getAccountStatusOptions = () => {
    if (isDoctor) {
      return [
        { value: "invited", label: "INVITED (default)" },
        { value: "active_pending", label: "ACTIVE_PENDING_SETUP" },
      ];
    }
    return [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ];
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!form.role) errs.role = "Please select a user type";
    if (!form.fullName || form.fullName.trim().length < 2) errs.fullName = "Full name is required (min 2 characters)";
    if (!form.email) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Invalid email format";
    }
    if (!form.phone) {
      errs.phone = "Phone number is required";
    } else if (!/^[0-9]{10,11}$/.test(form.phone)) {
      errs.phone = "Phone must be 10-11 digits";
    }

    if (isDoctor) {
      if (!form.specialization) errs.specialization = "Specialization is required for doctor";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (sendInviteOverride?: boolean) => {
    if (!validate()) return;

    setLoading(true);
    setApiError(null);

    try {
      const roleObj = roles.find((r) => r.name === form.role);
      if (!roleObj) {
        setApiError("Role not found. Please reload the page.");
        setLoading(false);
        return;
      }

      const password = generatePassword();
      const shouldSendInvite = sendInviteOverride ?? (isDoctor && form.sendInvite);

      const payload = {
        email: form.email.trim(),
        password,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        isActive: isDoctor ? false : form.isActive,
        isVerified: false,
        roleIds: [roleObj.id],
        // Doctor-specific fields
        ...(isDoctor && {
          specialization: form.specialization,
          subSpecialization: form.subSpecialization || undefined,
          yearsOfExperience: form.yearsOfExperience || undefined,
          qualification: form.qualification || undefined,
          notes: form.notes || undefined,
          sendInvite: shouldSendInvite,
        }),
      };

      const result = await adminService.createUser(payload);

      setCreatedUser({
        id: result.userId,
        email: result.email,
        roles: result.roles ? [...result.roles] : [form.role],
      });

      setInviteStatus(result.inviteStatus || "not_sent");
      setShowSuccess(true);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
        const msg = axiosErr.response?.data?.message || "Failed to create user";
        if (msg.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: msg }));
        } else if (msg.toLowerCase().includes("phone")) {
          setErrors((prev) => ({ ...prev, phone: msg }));
        } else {
          setApiError(msg);
        }
      } else {
        setApiError("Failed to create user. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      role: "",
      fullName: "",
      email: "",
      phone: "",
      isActive: true,
      specialization: "",
      subSpecialization: "",
      yearsOfExperience: "",
      qualification: "",
      notes: "",
      sendInvite: true,
    });
    setErrors({});
    setApiError(null);
    setShowSuccess(false);
    setCreatedUser(null);
    setInviteStatus(null);
  };

  // ============== SUCCESS MODAL ==============
  if (showSuccess && createdUser) {
    return (
      <>
        <PageMeta title="User Created | MediTech Admin" description="" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {isDoctor ? "Doctor Account Created Successfully" : "User Created Successfully"}
            </h2>

            {inviteStatus === "failed" && (
              <div className="mb-4 px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                  ⚠ User created successfully, but invitation email failed to send.
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 space-y-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <SummaryRow label="Name" value={form.fullName} />
              <SummaryRow label="Email" value={createdUser.email} />
              <SummaryRow label="Role" value={createdUser.roles?.join(", ") || form.role} />
              {isDoctor && (
                <>
                  <SummaryRow label="Verification Status" value="AWAITING_DOCUMENTS" />
                  <SummaryRow
                    label="Invitation Email"
                    value={
                      inviteStatus === "sent"
                        ? "✅ Sent"
                        : inviteStatus === "failed"
                        ? "❌ Failed"
                        : "Not sent"
                    }
                  />
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => navigate(`/admin/user-list`)}
                className="w-full px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/30 transition"
              >
                Open User List
              </button>
              {isDoctor && (
                <button
                  onClick={() => navigate("/admin/doctor-verification")}
                  className="w-full px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800 dark:hover:bg-green-900/30 transition"
                >
                  Open Doctor Verification
                </button>
              )}
              {inviteStatus === "failed" && createdUser && (
                <button
                  onClick={async () => {
                    try {
                      // Re-create user with sendInvite to trigger email
                      // Since user already exists, we just try the staff invite endpoint
                      await adminService.createStaffInvite({
                        email: form.email.trim(),
                        phone: form.phone.trim(),
                        fullName: form.fullName.trim(),
                        expectedRole: "DOCTOR",
                        notes: form.notes || `Specialization: ${form.specialization}`,
                      });
                      setInviteStatus("sent");
                    } catch {
                      // Staff registry might already exist, just inform user
                      showToast("Could not resend invitation. The staff registry may already exist. Please check the Staff Registry page.", "error");
                    }
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800 dark:hover:bg-orange-900/30 transition"
                >
                  🔄 Resend Invite
                </button>
              )}
              <button
                onClick={handleReset}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition"
              >
                + Create Another User
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ============== MAIN FORM ==============
  return (
    <>
      <PageMeta
        title="Create New User | MediTech Admin"
        description="Create a new system user account"
      />
      <PageBreadcrumb pageTitle="Create New User" />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New User</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create a system account and assign an initial role
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/user-list")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 transition"
          >
            ← Back to Users
          </button>
        </div>

        {/* API Error */}
        {apiError && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{apiError}</p>
          </div>
        )}

        {/* Section A — User Type */}
        <FormSection title="User Type" description="Select the role for the new user">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User Type / Role <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["PATIENT", "RECEPTIONIST", "DOCTOR", "ADMIN"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    updateField("role", r);
                    if (r !== "DOCTOR") {
                      updateField("isActive", true);
                    } else {
                      updateField("isActive", false);
                    }
                  }}
                  className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                    form.role === r
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-600"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <span className="block text-lg mb-1">
                    {r === "PATIENT" ? "🧑‍🤒" : r === "RECEPTIONIST" ? "🧑‍💼" : r === "DOCTOR" ? "🩺" : "🛡️"}
                  </span>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            {errors.role && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.role}</p>}
          </div>
        </FormSection>

        {/* Section B — Basic Information */}
        {form.role && (
          <FormSection title="Basic Information" description="Enter user account details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <InputField
                  label="Full Name"
                  required
                  value={form.fullName}
                  onChange={(v) => updateField("fullName", v)}
                  error={errors.fullName}
                  placeholder="e.g. Nguyen Van A"
                />
              </div>
              <InputField
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={(v) => updateField("email", v)}
                error={errors.email}
                placeholder="e.g. user@example.com"
              />
              <InputField
                label="Phone Number"
                required
                type="tel"
                value={form.phone}
                onChange={(v) => updateField("phone", v)}
                error={errors.phone}
                placeholder="e.g. 0901234567"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Status
                </label>
                <select
                  value={isDoctor ? "invited" : form.isActive ? "active" : "inactive"}
                  onChange={(e) => {
                    if (!isDoctor) {
                      updateField("isActive", e.target.value === "active");
                    }
                  }}
                  disabled={isDoctor}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-60"
                >
                  {getAccountStatusOptions().map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FormSection>
        )}

        {/* Section C — Doctor Setup */}
        {isDoctor && (
          <FormSection
            title="Doctor Setup"
            description="Configure doctor-specific settings"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.specialization}
                  onChange={(e) => updateField("specialization", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select specialization...</option>
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.specialization && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.specialization}</p>
                )}
              </div>
              <InputField
                label="Sub-specialization"
                value={form.subSpecialization}
                onChange={(v) => updateField("subSpecialization", v)}
                placeholder="e.g. Interventional Cardiology"
              />
              <InputField
                label="Years of Experience"
                type="number"
                value={form.yearsOfExperience}
                onChange={(v) => updateField("yearsOfExperience", v)}
                placeholder="e.g. 5"
              />
              <InputField
                label="Qualification"
                value={form.qualification}
                onChange={(v) => updateField("qualification", v)}
                placeholder="e.g. MD, PhD"
              />
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (internal)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={2}
                  placeholder="Internal notes about this doctor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Invitation Mode */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sendInvite}
                  onChange={(e) => updateField("sendInvite", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Send email invitation immediately
                </span>
              </label>
            </div>

            {/* Info Banner */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>ℹ Info:</strong> This account will be created with role = <strong>DOCTOR</strong> and
                verification_status = <strong>AWAITING_DOCUMENTS</strong>. The doctor must activate the account,
                complete profile, and upload verification documents before gaining clinical access.
              </p>
            </div>
          </FormSection>
        )}

        {/* Section D — Security / Access Preview (Doctor only) */}
        {isDoctor && (
          <FormSection title="Security / Access Preview" description="Read-only access preview">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PreviewRow label="Role" value="DOCTOR" />
              <PreviewRow label="Verification Status" value="AWAITING_DOCUMENTS" />
              <PreviewRow label="Clinical Access" value="Disabled until verified" />
              <PreviewRow label="Initial Access" value="Verification / Onboarding only" />
            </div>
          </FormSection>
        )}

        {/* Section E — Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            onClick={() => navigate("/admin/user-list")}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          {isDoctor && form.sendInvite ? (
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <Spinner />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
              Create & Send Invite
            </button>
          ) : (
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? (
                <Spinner />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
              Create User
            </button>
          )}
        </div>
      </div>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

// ============== SUB-COMPONENTS ==============

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/[0.03] overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function InputField({
  label,
  required,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
