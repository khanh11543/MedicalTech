import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  QueueListIcon,
  ClockIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
  ArchiveBoxIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import PageMeta from "../../components/common/PageMeta";
import AllAppointments from "./Appointments/AllAppointments";
import TodayAppointments from "./Appointments/TodayAppointments";
import UpcomingAppointments from "./Appointments/UpcomingAppointments";
import PendingAppointments from "./Appointments/PendingAppointments";
import HistoryAppointments from "./Appointments/HistoryAppointments";
import CreateAppointment from "./Appointments/CreateAppointment";
import type { RebookData } from "./Appointments/CreateAppointment";

type TabKey = "all" | "today" | "upcoming" | "pending" | "history";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { key: "all", label: "All", icon: QueueListIcon },
  { key: "today", label: "Today", icon: ClockIcon },
  { key: "upcoming", label: "Upcoming", icon: CalendarDaysIcon },
  { key: "pending", label: "Pending", icon: ExclamationCircleIcon },
  { key: "history", label: "History", icon: ArchiveBoxIcon },
];

export default function ReceptionistAppointments() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const saved = sessionStorage.getItem("receptionist_apt_tab");
    return (saved as TabKey) || "all";
  });
  const [showCreate, setShowCreate] = useState(false);
  const [rebookData, setRebookData] = useState<RebookData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    sessionStorage.setItem("receptionist_apt_tab", key);
  };

  const handleViewDetail = (id: number) => {
    navigate(`/receptionist/appointments/${id}`);
  };

  const handleCreateNew = () => {
    setRebookData(null);
    setShowCreate(true);
  };

  const handleRebook = (data: RebookData) => {
    setRebookData(data);
    setShowCreate(true);
  };

  const handleCreated = () => {
    setShowCreate(false);
    setRebookData(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <PageMeta
        title="Appointment Management | Receptionist MediTech"
        description="Manage medical appointments"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Appointment Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Book Appointment
          </button>
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

        {/* Tab content */}
        <div key={refreshKey}>
          {activeTab === "all" && <AllAppointments onViewDetail={handleViewDetail} onCreateNew={handleCreateNew} onRebook={handleRebook} />}
          {activeTab === "today" && <TodayAppointments onViewDetail={handleViewDetail} onCreateNew={handleCreateNew} onRebook={handleRebook} />}
          {activeTab === "upcoming" && <UpcomingAppointments onViewDetail={handleViewDetail} onCreateNew={handleCreateNew} />}
          {activeTab === "pending" && <PendingAppointments onViewDetail={handleViewDetail} onCreateNew={handleCreateNew} />}
          {activeTab === "history" && <HistoryAppointments onViewDetail={handleViewDetail} onCreateNew={handleCreateNew} onRebook={handleRebook} />}
        </div>
      </div>

      {/* Create Appointment Modal */}
      <CreateAppointment isOpen={showCreate} onClose={() => { setShowCreate(false); setRebookData(null); }} onCreated={handleCreated} rebookData={rebookData} />
    </>
  );
}
