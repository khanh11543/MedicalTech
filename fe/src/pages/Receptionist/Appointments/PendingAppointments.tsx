import { useEffect, useState, useCallback } from "react";
import receptionistService from "../../../services/receptionistService";
import type { ReceptionistAppointmentListDTO } from "../../../services/receptionistService";
import { StatusBadge, Spinner, EmptyState, Pagination, Toast, ConfirmDialog } from "./SharedComponents";

interface PendingAppointmentsProps {
  onViewDetail: (id: number) => void;
  onCreateNew: () => void;
}

export default function PendingAppointments({ onViewDetail, onCreateNew }: PendingAppointmentsProps) {
  const [appointments, setAppointments] = useState<ReceptionistAppointmentListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ReceptionistAppointmentListDTO | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await receptionistService.getAppointments({
        statuses: "PENDING",
        sortBy: "createdAt",
        sortDir: "desc",
        pageNumber: page,
        pageSize,
      });
      setAppointments(data?.content || []);
      setTotalElements(data?.totalElements || 0);
      setTotalPages(data?.totalPages || 0);
    } catch (error) {
      console.error("Failed to fetch pending:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Priority classification
  const getPriority = (apt: ReceptionistAppointmentListDTO): "urgent" | "warning" | "normal" => {
    const now = new Date();
    // Scheduled within 24 hours → urgent (red)
    const aptDateTime = new Date(`${apt.appointmentDate}T${apt.startTime}`);
    const hoursUntilApt = (aptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilApt > 0 && hoursUntilApt < 24) return "urgent";

    // Created more than 24 hours ago → warning (yellow)
    if (apt.createdAt) {
      const created = new Date(apt.createdAt);
      const hoursOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      if (hoursOld > 24) return "warning";
    }
    return "normal";
  };

  const priorityClasses = {
    urgent: "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10",
    warning: "border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10",
    normal: "",
  };

  const handleConfirm = async (apt: ReceptionistAppointmentListDTO) => {
    try {
      setActionLoading(apt.id);
      await receptionistService.confirmAppointment(apt.id);
      setToast({ message: `Confirmed: ${apt.appointmentCode}`, type: "success" });
      fetchData();
    } catch {
      setToast({ message: "Confirmation failed", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    try {
      setActionLoading(cancelTarget.id);
      await receptionistService.cancelAppointment(cancelTarget.id, cancelReason.trim());
      setToast({ message: `Cancelled: ${cancelTarget.appointmentCode}`, type: "success" });
      setCancelTarget(null);
      setCancelReason("");
      fetchData();
    } catch {
      setToast({ message: "Cancellation failed", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedIds.length === 0) return;
    try {
      setLoading(true);
      const result = await receptionistService.bulkConfirm(selectedIds);
      setToast({
        message: `${result.successCount}/${result.totalRequested} confirmed`,
        type: result.failureCount > 0 ? "info" : "success",
      });
      setSelectedIds([]);
      fetchData();
    } catch {
      setToast({ message: "Bulk confirm failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleAll = () => {
    const ids = appointments.map((a) => a.id);
    setSelectedIds((prev) => (prev.length === ids.length ? [] : ids));
  };

  const urgentCount = appointments.filter((a) => getPriority(a) === "urgent").length;
  const warningCount = appointments.filter((a) => getPriority(a) === "warning").length;

  return (
    <div className="space-y-4">
      {/* Priority summary */}
      <div className="flex items-center gap-4 flex-wrap">
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-medium text-red-700 dark:text-red-300">{urgentCount} scheduled within 24h</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{warningCount} waiting &gt;24h</span>
          </div>
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400">{totalElements} pending total</span>
      </div>

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
            {selectedIds.length} selected
          </span>
          <button
            onClick={handleBulkConfirm}
            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Confirm All Selected
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Spinner />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <EmptyState message="No pending appointments — all caught up!" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === appointments.length && appointments.length > 0}
                    onChange={toggleAll}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Scheduled</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Doctor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {appointments.map((apt) => {
                const priority = getPriority(apt);
                return (
                  <tr key={apt.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${priorityClasses[priority]}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(apt.id)}
                        onChange={() => toggleSelect(apt.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => onViewDetail(apt.id)} className="text-sm font-mono text-brand-600 dark:text-brand-400 hover:underline">
                        {apt.appointmentCode || `#${apt.id}`}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white">{apt.appointmentDate}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{apt.startTime} – {apt.endTime}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{apt.patientName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{apt.maskedPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white">{apt.doctorName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{apt.doctorSpecialization}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{apt.appointmentType || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={apt.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {apt.createdAt ? new Date(apt.createdAt).toLocaleDateString() : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {actionLoading === apt.id ? (
                          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleConfirm(apt)}
                              className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setCancelTarget(apt)}
                              className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => onViewDetail(apt.id)}
                              className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                            >
                              View
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {/* Cancel dialog */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel Appointment"
        message={`Cancel ${cancelTarget?.appointmentCode}?`}
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => {
          setCancelTarget(null);
          setCancelReason("");
        }}
      >
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Reason for cancellation (required)"
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 mt-2"
        />
      </ConfirmDialog>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
