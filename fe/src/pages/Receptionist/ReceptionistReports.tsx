import { useState } from "react";
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";
import PageMeta from "../../components/common/PageMeta";
import DailyAppointmentsReport from "./Reports/DailyAppointmentsReport";
import DailyRevenueReport from "./Reports/DailyRevenueReport";
import QueuePerformanceReport from "./Reports/QueuePerformanceReport";

type TabKey = "appointments" | "revenue" | "queue";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { key: "appointments", label: "Daily Appointments", icon: CalendarDaysIcon },
  { key: "revenue", label: "Revenue Summary", icon: CurrencyDollarIcon },
  { key: "queue", label: "Queue Performance", icon: ClockIcon },
];

export default function ReceptionistReports() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const saved = sessionStorage.getItem("receptionist_report_tab");
    return (saved as TabKey) || "appointments";
  });

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    sessionStorage.setItem("receptionist_report_tab", key);
  };

  return (
    <>
      <PageMeta
        title="Reports | Receptionist MediTech"
        description="Reports and statistics"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ChartBarSquareIcon className="w-7 h-7 text-brand-500" />
              Reports
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "appointments" && <DailyAppointmentsReport />}
        {activeTab === "revenue" && <DailyRevenueReport />}
        {activeTab === "queue" && <QueuePerformanceReport />}
      </div>
    </>
  );
}
