import { useState, useEffect, useCallback } from "react";
import {
  UserCircleIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import PageMeta from "../../components/common/PageMeta";
import queueService, {
  type DoctorQueueStatusDTO,
  type QueuePatientDTO,
} from "../../services/queueService";
import { StatCard, useToast } from "./Queue/SharedComponents";
import QueueByDoctor from "./Queue/QueueByDoctor";
import AllQueuePatients from "./Queue/AllQueuePatients";
import AuditLog from "./Queue/AuditLog";
import CallNextModal from "./Queue/CallNextModal";
import ReorderModal from "./Queue/ReorderModal";
import AddWalkInModal from "./Queue/AddWalkInModal";
import MoveDoctorModal from "./Queue/MoveDoctorModal";
import UpdateDoctorStatusModal from "./Queue/UpdateDoctorStatusModal";

// ─── Tab config ───────────────────────────────────────────
type TabKey = "by-doctor" | "all-patients" | "audit";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { key: "by-doctor", label: "By Doctor", icon: UserCircleIcon },
  { key: "all-patients", label: "All Patients", icon: UsersIcon },
  { key: "audit", label: "Audit Log", icon: ClipboardDocumentListIcon },
];

// ─── Modal state types ────────────────────────────────────
interface ModalCallNext {
  doctorId: number;
  doctorName: string;
}
interface ModalReorder {
  doctorId: number;
  doctorName: string;
  patients: QueuePatientDTO[];
}
interface ModalAddWalkIn {
  doctorId: number;
  doctorName: string;
}
interface ModalMoveDoctor {
  appointmentId: number;
  patientName: string;
  currentDoctorId: number;
}
interface ModalNoShow {
  appointmentId: number;
  patientName: string;
  queueNumber: number;
}
interface ModalDoctorStatus {
  doctorId: number;
  doctorName: string;
  currentStatus: string;
}

// ═══════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════
export default function ReceptionistQueue() {
  // ─── Tab ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const saved = sessionStorage.getItem("receptionist_queue_tab");
    return (saved as TabKey) || "by-doctor";
  });
  // ─── Refresh ────────────────────────────────────────────
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  // ─── Summary stats ─────────────────────────────────────
  const [stats, setStats] = useState({ total: 0, waiting: 0, inProgress: 0, available: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const doctors: DoctorQueueStatusDTO[] = await queueService.getQueueStatus();
      const waiting = doctors.reduce((s, d) => s + (d.checkedInWaiting || 0), 0);
      const inProgress = doctors.filter((d) => d.currentPatient).length;
      const available = doctors.filter((d) => d.doctorStatus === "AVAILABLE").length;
      setStats({ total: doctors.length, waiting, inProgress, available });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  // Auto-refresh stats every 30s
  useEffect(() => {
    const timer = setInterval(fetchStats, 30000);
    return () => clearInterval(timer);
  }, [fetchStats]);

  // ─── Toast ──────────────────────────────────────────────
  const { showToast, ToastComponent } = useToast();

  // ─── Modals ─────────────────────────────────────────────
  const [callNextModal, setCallNextModal] = useState<ModalCallNext | null>(null);
  const [reorderModal, setReorderModal] = useState<ModalReorder | null>(null);
  const [addWalkInModal, setAddWalkInModal] = useState<ModalAddWalkIn | null>(null);
  const [moveDoctorModal, setMoveDoctorModal] = useState<ModalMoveDoctor | null>(null);
  const [noShowConfirm, setNoShowConfirm] = useState<ModalNoShow | null>(null);
  const [doctorStatusModal, setDoctorStatusModal] = useState<ModalDoctorStatus | null>(null);
  const [noShowLoading, setNoShowLoading] = useState(false);
  const [noShowReason, setNoShowReason] = useState("");

  // ─── Tab change ─────────────────────────────────────────
  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    sessionStorage.setItem("receptionist_queue_tab", key);
  };

  // ─── Handlers ───────────────────────────────────────────
  const handleCallNext = (doctorId: number, doctorName: string) => {
    setCallNextModal({ doctorId, doctorName });
  };

  const handleReorder = (doctorId: number, doctorName: string, patients: QueuePatientDTO[]) => {
    setReorderModal({ doctorId, doctorName, patients });
  };

  const handleAddWalkIn = (doctorId: number, doctorName: string) => {
    setAddWalkInModal({ doctorId, doctorName });
  };

  const handleMoveDoctor = (appointmentId: number, patientName: string, fromDoctorId: number) => {
    setMoveDoctorModal({ appointmentId, patientName, currentDoctorId: fromDoctorId });
  };

  const handleMarkNoShow = (appointmentId: number, patientName: string) => {
    setNoShowReason("");
    setNoShowConfirm({ appointmentId, patientName, queueNumber: 0 });
  };

  const handleUpdateDoctorStatus = (doctorId: number, doctorName: string, currentStatus: string) => {
    setDoctorStatusModal({ doctorId, doctorName, currentStatus });
  };

  const handleViewHistory = (_doctorId: number) => {
    setActiveTab("audit");
    sessionStorage.setItem("receptionist_queue_tab", "audit");
  };

  const confirmNoShow = async () => {
    if (!noShowConfirm) return;
    if (!noShowReason.trim()) return;
    try {
      setNoShowLoading(true);
      await queueService.markNoShow(noShowConfirm.appointmentId, {
        reason: noShowReason.trim(),
        sendNotification: true,
      });
      showToast(`Patient ${noShowConfirm.patientName} marked as no-show`, "success");
      refresh();
    } catch {
      showToast("Failed to mark as no-show", "error");
    } finally {
      setNoShowLoading(false);
      setNoShowConfirm(null);
      setNoShowReason("");
    }
  };

  // ─── Modal success callbacks ────────────────────────────
  const onCallNextSuccess = () => {
    showToast("Patient called successfully", "success");
    refresh();
  };
  const onReorderSuccess = () => {
    showToast("Queue reordered", "success");
    refresh();
  };
  const onAddWalkInSuccess = () => {
    showToast("Walk-in patient added", "success");
    refresh();
  };
  const onMoveDoctorSuccess = () => {
    showToast("Patient moved to new doctor", "success");
    refresh();
  };
  const onDoctorStatusSuccess = () => {
    showToast("Doctor status updated", "success");
    refresh();
  };

  return (
    <>
      <PageMeta
        title="Queue Management | Receptionist MediTech"
        description="Manage patient queue"
      />

      <div className="space-y-6">
        {/* ─── Header ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClockIcon className="w-7 h-7 text-brand-500" />
              Queue Management
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
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Auto-refresh 30s
            </span>
            <button
              onClick={refresh}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium shadow-sm"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* ─── Summary Stats ─────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Doctors" value={stats.total} color="brand" />
          <StatCard label="Available" value={stats.available} color="green" />
          <StatCard label="Waiting" value={stats.waiting} color="amber" />
          <StatCard label="In Progress" value={stats.inProgress} color="blue" />
        </div>

        {/* ─── Tabs ──────────────────────────────────────── */}
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

        {/* ─── Tab Content ───────────────────────────────── */}
        {activeTab === "by-doctor" && (
          <QueueByDoctor
            refreshKey={refreshKey}
            onCallNext={handleCallNext}
            onReorder={handleReorder}
            onAddWalkIn={handleAddWalkIn}
            onMarkNoShow={handleMarkNoShow}
            onMoveDoctor={handleMoveDoctor}
            onUpdateDoctorStatus={handleUpdateDoctorStatus}
            onViewHistory={handleViewHistory}
          />
        )}

        {activeTab === "all-patients" && (
          <AllQueuePatients
            refreshKey={refreshKey}
            onMarkNoShow={handleMarkNoShow}
            onMoveDoctor={handleMoveDoctor}
          />
        )}

        {activeTab === "audit" && <AuditLog refreshKey={refreshKey} />}
      </div>

      {/* ═══ Modals ═══════════════════════════════════════════ */}

      {/* Call Next Patient */}
      {callNextModal && (
        <CallNextModal
          isOpen={true}
          doctorId={callNextModal.doctorId}
          doctorName={callNextModal.doctorName}
          onClose={() => setCallNextModal(null)}
          onSuccess={() => onCallNextSuccess()}
        />
      )}

      {/* Reorder Queue */}
      {reorderModal && (
        <ReorderModal
          isOpen={true}
          doctorId={reorderModal.doctorId}
          doctorName={reorderModal.doctorName}
          patients={reorderModal.patients}
          onClose={() => setReorderModal(null)}
          onSuccess={onReorderSuccess}
        />
      )}

      {/* Add Walk-In */}
      {addWalkInModal && (
        <AddWalkInModal
          isOpen={true}
          doctorId={addWalkInModal.doctorId}
          doctorName={addWalkInModal.doctorName}
          onClose={() => setAddWalkInModal(null)}
          onSuccess={() => onAddWalkInSuccess()}
        />
      )}

      {/* Move Doctor */}
      {moveDoctorModal && (
        <MoveDoctorModal
          isOpen={true}
          appointmentId={moveDoctorModal.appointmentId}
          patientName={moveDoctorModal.patientName}
          fromDoctorId={moveDoctorModal.currentDoctorId}
          onClose={() => setMoveDoctorModal(null)}
          onSuccess={() => onMoveDoctorSuccess()}
        />
      )}

      {/* Update Doctor Status */}
      {doctorStatusModal && (
        <UpdateDoctorStatusModal
          isOpen={true}
          doctorId={doctorStatusModal.doctorId}
          doctorName={doctorStatusModal.doctorName}
          currentStatus={doctorStatusModal.currentStatus}
          onClose={() => setDoctorStatusModal(null)}
          onSuccess={onDoctorStatusSuccess}
        />
      )}

      {/* No-Show Modal (with mandatory reason) */}
      {noShowConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setNoShowConfirm(null); setNoShowReason(""); }}></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mark as No-Show</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Patient: <span className="font-medium">{noShowConfirm.patientName}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
                <p className="font-medium">Policy Reminder:</p>
                <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
                  <li>Ensure the patient has been called at least 2 times</li>
                  <li>Wait at least 3-5 minutes after the last call</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>

              {/* Reason presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    "Patient did not respond after multiple calls",
                    "Patient left without notice",
                    "Patient unreachable by phone",
                    "Patient declined to be seen",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNoShowReason(preset)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        noShowReason === preset
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  value={noShowReason}
                  onChange={(e) => setNoShowReason(e.target.value)}
                  placeholder="Describe why this patient is being marked as no-show..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
                {!noShowReason.trim() && (
                  <p className="text-xs text-red-500 mt-1">Reason is required</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => { setNoShowConfirm(null); setNoShowReason(""); }}
                disabled={noShowLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmNoShow}
                disabled={noShowLoading || !noShowReason.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {noShowLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Mark No-Show
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Toast ═══════════════════════════════════════════ */}
      <ToastComponent />
    </>
  );
}
