// Patient-specific badge & UI components
// Reuse Spinner, EmptyState, Pagination, ConfirmDialog, Toast from Appointments/SharedComponents

export { Spinner, EmptyState, Pagination, ConfirmDialog, Toast } from "../Appointments/SharedComponents";

// ==================== Gender Badge ====================
export function GenderBadge({ gender }: { gender: string }) {
  const g = gender?.toUpperCase();
  const config: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    MALE: { label: "Male", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-900/30", icon: "M" },
    FEMALE: { label: "Female", color: "text-pink-700 dark:text-pink-300", bg: "bg-pink-50 dark:bg-pink-900/30", icon: "F" },
    OTHER: { label: "Other", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-900/30", icon: "O" },
  };
  const c = config[g] || { label: gender || "N/A", color: "text-gray-700", bg: "bg-gray-100", icon: "?" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.color}`}>
      <span>{c.icon}</span> {c.label}
    </span>
  );
}

// ==================== Insurance Badge ====================
export function InsuranceBadge({ status }: { status: string }) {
  const isInsured = status?.toUpperCase() === "INSURED";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isInsured
          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
      }`}
    >
      {isInsured ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      )}
      {isInsured ? "Insured" : "Uninsured"}
    </span>
  );
}

// ==================== Active Status Badge ====================
export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isActive
          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
          : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ==================== Stats Card ====================
interface StatsCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: string;
  subLabel?: string;
}

export function StatsCard({ label, value, icon, color = "text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400", subLabel }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        {subLabel && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subLabel}</p>}
      </div>
    </div>
  );
}

// ==================== "New" Tag Badge ====================
export function NewBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 ml-2">
      NEW
    </span>
  );
}
