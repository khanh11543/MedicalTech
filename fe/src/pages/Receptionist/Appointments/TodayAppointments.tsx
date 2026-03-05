import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import receptionistService from "../../../services/receptionistService";
import type { ReceptionistAppointmentListDTO } from "../../../services/receptionistService";
import { StatusBadge, PaymentBadge, Spinner, EmptyState, Pagination, QueueBadge, Toast } from "./SharedComponents";
import ActionMenu from "./ActionMenu";
import { ConfirmAppointmentModal, RescheduleModal, CancelAppointmentModal } from "./PendingActionModals";
import { CheckInModal, SendReminderModal } from "./ConfirmedActionModals";
import { NotifyDoctorModal, MarkNoShowModal } from "./CheckedInActionModals";
import { ViewInProgressModal } from "./InProgressActionModals";
import { CollectPaymentModal, ReceiptActionsModal, CreateFollowUpModal } from "./CompletedActionModals";
import { ViewReasonModal, RebookModal } from "./CancelledNoShowActionModals";
import type { RebookData } from "./CreateAppointment";

interface TodayAppointmentsProps {
  onViewDetail: (id: number) => void;
  onCreateNew: () => void;
  onRebook?: (data: RebookData) => void;
}

export default function TodayAppointments({ onViewDetail, onCreateNew, onRebook }: TodayAppointmentsProps) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<ReceptionistAppointmentListDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });
  const [rescheduleModal, setRescheduleModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });
  const [cancelModal, setCancelModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });
  const [checkInModal, setCheckInModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });
  const [reminderModal, setReminderModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });
  const [notifyDoctorModal, setNotifyDoctorModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });
  const [noShowModal, setNoShowModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });
  const [viewInProgressModal, setViewInProgressModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });

  // COMPLETED modal states
  const [collectPaymentModal, setCollectPaymentModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });
  const [receiptModal, setReceiptModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });
  const [followUpModal, setFollowUpModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });

  // CANCELLED / NO_SHOW modal states
  const [viewReasonModal, setViewReasonModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });
  const [rebookModal, setRebookModal] = useState<{ open: boolean; appointment: ReceptionistAppointmentListDTO | null }>({ open: false, appointment: null });

  // Summary counts
  const [summary, setSummary] = useState({ notCheckedIn: 0, waiting: 0, completed: 0, needsPayment: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await receptionistService.getTodayAppointmentsV2(page, pageSize, statusFilter || undefined);
      const items = data?.content || [];
      setAppointments(items);
      setTotalElements(data?.totalElements || 0);
      setTotalPages(data?.totalPages || 0);
      setLastRefresh(new Date());

      // Compute summary from full today (fetch page 0, size 200 for summary counts — or use stats endpoint)
      try {
        const stats = await receptionistService.getDashboardStatsV2();
        setSummary({
          notCheckedIn: stats.awaitingCheckIn || 0,
          waiting: stats.totalInQueue || 0,
          completed: stats.completedAppointments || 0,
          needsPayment: stats.pendingPayments || 0,
        });
      } catch {
        // Fallback: compute from the list
        setSummary({
          notCheckedIn: items.filter((a) => a.status === "CONFIRMED").length,
          waiting: items.filter((a) => a.status === "CHECKED_IN").length,
          completed: items.filter((a) => a.status === "COMPLETED").length,
          needsPayment: 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch today's appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchData();
    }, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Quick pill filter
  const quickPills = [
    { label: "All", value: "", count: totalElements },
    { label: "Not Checked-in", value: "CONFIRMED", count: summary.notCheckedIn, color: "text-blue-600" },
    { label: "Waiting", value: "CHECKED_IN", count: summary.waiting, color: "text-green-600" },
    { label: "Completed", value: "COMPLETED", count: summary.completed, color: "text-emerald-600" },
    { label: "Needs Payment", value: "NEEDS_PAYMENT", count: summary.needsPayment, color: "text-orange-600" },
  ];

  const handleAction = async (action: string, apt: ReceptionistAppointmentListDTO) => {
    switch (action) {
      case "VIEW":
        if (apt.status === "IN_PROGRESS") {
          setViewInProgressModal({ open: true, appointment: apt });
        } else {
          onViewDetail(apt.id);
        }
        break;
      case "CHECK_IN":
        setCheckInModal({ open: true, appointment: apt });
        break;
      case "CONFIRM":
        setConfirmModal({ open: true, appointment: apt });
        break;
      case "SEND_REMINDER":
        setReminderModal({ open: true, appointment: apt });
        break;
      case "MARK_NO_SHOW":
        setNoShowModal({ open: true, appointment: apt });
        break;
      case "CANCEL":
        setCancelModal({ open: true, appointment: apt });
        break;
      case "RESCHEDULE":
        setRescheduleModal({ open: true, appointment: apt });
        break;
      case "VIEW_QUEUE":
        navigate("/receptionist/queue");
        break;
      case "NOTIFY_DOCTOR":
        setNotifyDoctorModal({ open: true, appointment: apt });
        break;
      case "PRINT_SLIP":
        try {
          setActionLoading(apt.id);
          const blob = await receptionistService.printCheckInSlip(apt.id);
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
        } catch {
          setToast({ message: "Failed to generate slip", type: "error" });
        } finally {
          setActionLoading(null);
        }
        break;
      case "COLLECT_PAYMENT":
        if (apt.paymentStatus === "PAID") {
          setReceiptModal({ open: true, appointment: apt });
        } else {
          setCollectPaymentModal({ open: true, appointment: apt });
        }
        break;
      case "RECEIPT":
        setReceiptModal({ open: true, appointment: apt });
        break;
      case "CREATE_FOLLOW_UP":
        setFollowUpModal({ open: true, appointment: apt });
        break;
      case "VIEW_REASON":
        setViewReasonModal({ open: true, appointment: apt });
        break;
      case "REBOOK":
        setRebookModal({ open: true, appointment: apt });
        break;
      default:
        onViewDetail(apt.id);
    }
  };

  // Current time indicator
  const now = new Date();
  const currentTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="space-y-4">
      {/* Quick pills + auto-refresh indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {quickPills.map((pill) => (
            <button
              key={pill.value}
              onClick={() => { setStatusFilter(pill.value); setPage(0); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                statusFilter === pill.value
                  ? "bg-brand-500 text-white shadow-sm"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {pill.label}
              <span className={`text-xs font-bold ${statusFilter === pill.value ? "text-white/80" : pill.color || "text-gray-400"}`}>
                {pill.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Now: {currentTime}
          </div>
          <span className="text-xs text-gray-400">
            Updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Timeline table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : appointments.length === 0 ? (
          <EmptyState message="No appointments for today" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Doctor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Payment</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Queue</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase min-w-[220px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {appointments.map((apt) => {
                    // Highlight current time slot
                    const isPast = apt.endTime && apt.endTime < currentTime;
                    const isCurrent = apt.startTime <= currentTime && (!apt.endTime || apt.endTime >= currentTime);

                    return (
                      <tr
                        key={apt.id}
                        className={`transition-colors ${
                          isCurrent
                            ? "bg-brand-50 dark:bg-brand-900/10 border-l-4 border-l-brand-500"
                            : isPast
                            ? "opacity-60"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {apt.startTime}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {apt.endTime}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onViewDetail(apt.id)}
                            className="text-sm font-mono text-brand-600 dark:text-brand-400 hover:underline"
                          >
                            {apt.appointmentCode || `#${apt.id}`}
                          </button>
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
                          <StatusBadge status={apt.status} />
                          {apt.checkedInAt && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              In: {apt.checkedInAt.split("T")[1]?.substring(0, 5)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <PaymentBadge status={apt.paymentStatus} />
                          {apt.fee != null && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {apt.fee.toLocaleString()} ₫
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <QueueBadge number={apt.queueNumber} />
                        </td>
                        <td className="px-4 py-3">
                          {actionLoading === apt.id ? (
                            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ActionMenu appointment={apt} onAction={handleAction} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
            />
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* COMPLETED modals */}
      <CollectPaymentModal
        isOpen={collectPaymentModal.open}
        appointment={collectPaymentModal.appointment}
        onClose={() => setCollectPaymentModal({ open: false, appointment: null })}
        onSuccess={(msg) => { setToast({ message: msg, type: "success" }); }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
        onRefresh={fetchData}
      />
      <ReceiptActionsModal
        isOpen={receiptModal.open}
        appointment={receiptModal.appointment}
        onClose={() => setReceiptModal({ open: false, appointment: null })}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />
      <CreateFollowUpModal
        isOpen={followUpModal.open}
        appointment={followUpModal.appointment}
        onClose={() => setFollowUpModal({ open: false, appointment: null })}
        onSuccess={(msg) => { setToast({ message: msg, type: "success" }); }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      {/* IN_PROGRESS modals */}
      <ViewInProgressModal
        isOpen={viewInProgressModal.open}
        appointment={viewInProgressModal.appointment}
        onClose={() => setViewInProgressModal({ open: false, appointment: null })}
      />

      {/* CHECKED_IN modals */}
      <NotifyDoctorModal
        isOpen={notifyDoctorModal.open}
        appointment={notifyDoctorModal.appointment}
        onClose={() => setNotifyDoctorModal({ open: false, appointment: null })}
        onSuccess={() => {
          setNotifyDoctorModal({ open: false, appointment: null });
          setToast({ message: "Doctor notified successfully", type: "success" });
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />
      <MarkNoShowModal
        isOpen={noShowModal.open}
        appointment={noShowModal.appointment}
        onClose={() => setNoShowModal({ open: false, appointment: null })}
        onSuccess={() => {
          setNoShowModal({ open: false, appointment: null });
          setToast({ message: "Patient marked as no-show", type: "success" });
          fetchData();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      {/* CONFIRMED modals */}
      <CheckInModal
        isOpen={checkInModal.open}
        appointment={checkInModal.appointment}
        onClose={() => setCheckInModal({ open: false, appointment: null })}
        onSuccess={() => {
          setCheckInModal({ open: false, appointment: null });
          setToast({ message: "Patient checked in successfully", type: "success" });
          fetchData();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />
      <SendReminderModal
        isOpen={reminderModal.open}
        appointment={reminderModal.appointment}
        onClose={() => setReminderModal({ open: false, appointment: null })}
        onSuccess={() => {
          setReminderModal({ open: false, appointment: null });
          setToast({ message: "Reminder sent successfully", type: "success" });
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      {/* PENDING modals */}
      <ConfirmAppointmentModal
        isOpen={confirmModal.open}
        appointment={confirmModal.appointment}
        onClose={() => setConfirmModal({ open: false, appointment: null })}
        onSuccess={() => {
          setConfirmModal({ open: false, appointment: null });
          setToast({ message: "Appointment confirmed", type: "success" });
          fetchData();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />
      <RescheduleModal
        isOpen={rescheduleModal.open}
        appointment={rescheduleModal.appointment}
        onClose={() => setRescheduleModal({ open: false, appointment: null })}
        onSuccess={() => {
          setRescheduleModal({ open: false, appointment: null });
          setToast({ message: "Appointment rescheduled", type: "success" });
          fetchData();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />
      <CancelAppointmentModal
        isOpen={cancelModal.open}
        appointment={cancelModal.appointment}
        onClose={() => setCancelModal({ open: false, appointment: null })}
        onSuccess={() => {
          setCancelModal({ open: false, appointment: null });
          setToast({ message: "Appointment cancelled", type: "success" });
          fetchData();
        }}
        onError={(msg) => setToast({ message: msg, type: "error" })}
      />

      {/* CANCELLED / NO_SHOW modals */}
      <ViewReasonModal
        isOpen={viewReasonModal.open}
        appointment={viewReasonModal.appointment}
        onClose={() => setViewReasonModal({ open: false, appointment: null })}
      />
      <RebookModal
        isOpen={rebookModal.open}
        appointment={rebookModal.appointment}
        onClose={() => setRebookModal({ open: false, appointment: null })}
        onRebook={(data) => {
          if (onRebook) {
            onRebook(data);
          } else {
            onCreateNew();
          }
        }}
      />
    </div>
  );
}
