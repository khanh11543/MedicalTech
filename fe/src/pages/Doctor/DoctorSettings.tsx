import { useState } from "react";
import {
  UserIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  PhoneIcon,
  BugAntIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import PageMeta from "../../components/common/PageMeta";
import PersonalTab from "../Receptionist/Settings/PersonalTab";
import WorkstationTab from "../Receptionist/Settings/WorkstationTab";
import DataPrivacyTab from "../Receptionist/Settings/DataPrivacyTab";

const tabs: { id: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: "personal", label: "Personal", icon: UserIcon },
  { id: "workstation", label: "Workstation", icon: BuildingOffice2Icon },
  { id: "privacy", label: "Data & Privacy", icon: ShieldCheckIcon },
  { id: "help", label: "Help & Support", icon: QuestionMarkCircleIcon },
];

const APP_VERSION = "1.0.0";

const guides = [
  { title: "Today's Schedule", description: "View and manage your daily appointments and patient queue" },
  { title: "Appointments", description: "Accept, reschedule, or cancel appointment requests" },
  { title: "Consultation", description: "Start consultations, record notes, and issue prescriptions" },
  { title: "Schedule Management", description: "Set your weekly availability and time-off periods" },
  { title: "My Patients", description: "View patient history, records, and previous consultations" },
  { title: "Reviews & Stats", description: "Monitor your ratings and performance statistics" },
];

function DoctorHelpSupportTab() {
  return (
    <div className="space-y-6">
      {/* Doctor Guide */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <BookOpenIcon className="w-5 h-5 text-brand-500" />
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Doctor Guide</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Quick reference for common clinical tasks.
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

      {/* Report an Issue */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-4">
          <BugAntIcon className="w-5 h-5 text-orange-500" />
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">Report an Issue</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Experiencing a bug or system error? Submit a report so the development team can resolve it quickly.
        </p>
        <button
          onClick={() => window.open("mailto:support@meditech.vn?subject=Bug%20Report%20-%20Doctor", "_blank")}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          Send Bug Report via Email
        </button>
      </div>

      {/* System Information */}
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
            <span className="font-medium text-gray-800 dark:text-white/90">Doctor</span>
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

export default function DoctorSettings() {
  const [activeTab, setActiveTab] = useState("personal");

  const renderTab = () => {
    switch (activeTab) {
      case "personal":
        return <PersonalTab />;
      case "workstation":
        return <WorkstationTab />;
      case "privacy":
        return <DataPrivacyTab />;
      case "help":
        return <DoctorHelpSupportTab />;
      default:
        return <PersonalTab />;
    }
  };

  return (
    <>
      <PageMeta
        title="Settings | Doctor MediTech"
        description="Personal and system settings"
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cog6ToothIcon className="w-7 h-7 text-brand-500" />
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Personal and system configuration
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="-mb-px flex gap-x-1" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-brand-500 text-brand-500"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4 mr-1.5 inline-block" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Active Tab Content */}
        <div>{renderTab()}</div>
      </div>
    </>
  );
}
