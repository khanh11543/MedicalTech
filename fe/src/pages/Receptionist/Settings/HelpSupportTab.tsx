import {
  BookOpenIcon,
  PhoneIcon,
  BugAntIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

const APP_VERSION = "1.0.0";

const guides = [
  { title: "Check-in Patient", description: "How to check-in a patient from appointment list or walk-in" },
  { title: "Collect Payment", description: "Process cash, bank transfer, or QR code payments" },
  { title: "Print Receipt / Invoice", description: "Reprint receipts or print A4 invoices" },
  { title: "Queue Management", description: "Manage waiting queue and call next patient" },
  { title: "Cancel / Reschedule", description: "Cancel or reschedule an existing appointment" },
];

export default function HelpSupportTab() {
  return (
    <div className="space-y-6">
      {/* User Guide */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <BookOpenIcon className="w-5 h-5 text-brand-500" />
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">User Guide</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Quick reference for common receptionist tasks.
        </p>
        <ul className="space-y-3">
          {guides.map((g) => (
            <li key={g.title} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
              <ArrowTopRightOnSquareIcon className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{g.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{g.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Hotline Support */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <PhoneIcon className="w-5 h-5 text-green-500" />
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Hotline Support</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300 w-28">IT Support:</span>
            <a href="tel:1900xxxx" className="text-sm font-medium text-brand-500 hover:underline">1900-XXXX</a>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300 w-28">System Admin:</span>
            <a href="tel:0901234567" className="text-sm font-medium text-brand-500 hover:underline">090-123-4567</a>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-300 w-28">Working hours:</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">Mon – Sat, 07:00 – 17:00</span>
          </div>
        </div>
      </div>

      {/* Submit Issue */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <BugAntIcon className="w-5 h-5 text-orange-500" />
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Report an Issue</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Experiencing a bug or system error? Submit a report so the IT team can resolve it quickly.
        </p>
        <button
          onClick={() => window.open("mailto:support@meditech.vn?subject=Bug%20Report%20-%20Receptionist", "_blank")}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          Send Bug Report via Email
        </button>
      </div>

      {/* System Version */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <InformationCircleIcon className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">System Information</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-300 w-36">Application:</span>
            <span className="font-medium text-gray-800 dark:text-white/90">MediTech Clinic</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-300 w-36">Version:</span>
            <span className="font-mono text-gray-800 dark:text-white/90">v{APP_VERSION}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-300 w-36">Role:</span>
            <span className="font-medium text-gray-800 dark:text-white/90">Receptionist</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-300 w-36">Browser:</span>
            <span className="text-gray-600 dark:text-gray-400 text-xs">{navigator.userAgent.split(" ").slice(-2).join(" ")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
