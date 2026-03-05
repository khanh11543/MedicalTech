import { useState } from "react";
import {
  UsersIcon,
  UserPlusIcon,
  StarIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import PageMeta from "../../components/common/PageMeta";
import AllPatients from "./Patients/AllPatients";
import NewPatients from "./Patients/NewPatients";
import FrequentPatients from "./Patients/FrequentPatients";
import PatientDetail from "./Patients/PatientDetail";
import CreatePatientModal from "./Patients/CreatePatientModal";
import CreateAppointment from "./Appointments/CreateAppointment";
import type { RebookData } from "./Appointments/CreateAppointment";

type TabKey = "all" | "new" | "frequent";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { key: "all", label: "All Patients", icon: UsersIcon },
  { key: "new", label: "New (This Month)", icon: UserPlusIcon },
  { key: "frequent", label: "Frequent", icon: StarIcon },
];

export default function ReceptionistPatients() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const saved = sessionStorage.getItem("receptionist_patient_tab");
    return (saved as TabKey) || "all";
  });
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Schedule appointment modal
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState<RebookData | null>(null);

  // Patient detail slide-over
  const [detailPatientId, setDetailPatientId] = useState<number | null>(null);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    sessionStorage.setItem("receptionist_patient_tab", key);
  };

  const handleViewDetail = (patientId: number) => {
    setDetailPatientId(patientId);
  };

  const handleCreateNew = () => setShowCreate(true);

  const handleCreated = () => {
    setShowCreate(false);
    setRefreshKey((k) => k + 1);
  };

  const handleSchedule = (patient: { patientId: number; patientName: string; maskedPhone?: string }) => {
    setScheduleData({
      patientId: patient.patientId,
      patientName: patient.patientName,
      maskedPhone: patient.maskedPhone,
    });
    setShowSchedule(true);
  };

  const handleAppointmentCreated = () => {
    setShowSchedule(false);
    setScheduleData(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <>
      <PageMeta
        title="Patient Management | Receptionist MediTech"
        description="Manage patient information"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Patient Management
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
            Register Patient
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
          {activeTab === "all" && (
            <AllPatients
              onViewDetail={handleViewDetail}
              refreshKey={refreshKey}
            />
          )}
          {activeTab === "new" && (
            <NewPatients
              onViewDetail={handleViewDetail}
              onSchedule={handleSchedule}
              refreshKey={refreshKey}
            />
          )}
          {activeTab === "frequent" && (
            <FrequentPatients
              onViewDetail={handleViewDetail}
              onQuickBook={(patientId, doctorId) => {
                // Open schedule modal with prefilled patient & doctor
                setScheduleData({
                  patientId,
                  patientName: "",
                  doctorId,
                });
                setShowSchedule(true);
              }}
              onSendReminder={(patientId) => {
                // Open patient detail to communication tab for sending reminder
                setDetailPatientId(patientId);
              }}
              refreshKey={refreshKey}
            />
          )}
        </div>
      </div>

      {/* Patient Detail Slide-over */}
      <PatientDetail
        patientId={detailPatientId || 0}
        isOpen={detailPatientId !== null}
        onClose={() => setDetailPatientId(null)}
        onUpdated={() => setRefreshKey((k) => k + 1)}
      />

      {/* Create Patient Modal */}
      <CreatePatientModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />

      {/* Schedule Appointment Modal */}
      <CreateAppointment
        isOpen={showSchedule}
        onClose={() => { setShowSchedule(false); setScheduleData(null); }}
        onCreated={handleAppointmentCreated}
        rebookData={scheduleData}
      />
    </>
  );
}
