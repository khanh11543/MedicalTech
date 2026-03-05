import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Modal } from "../../components/ui/modal";
import Badge from "../../components/ui/badge/Badge";
import Label from "../../components/form/Label";
import appointmentService, {
  AppointmentDetailDTO,
  AppointmentStatus,
  PaymentStatus,
  AppointmentHistoryDTO,
  CommunicationDTO,
  PrescriptionDTO,
  MedicalRecordDTO,
  PaymentRecordDTO,
  ReviewDTO,
  RescheduleDTO,
} from "../../services/appointmentService";

// =========== HELPER FUNCTIONS ===========
const getStatusBadgeColor = (status: AppointmentStatus) => {
  const colorMap: Record<AppointmentStatus, "warning" | "info" | "primary" | "error" | "success" | "light" | "dark"> = {
    [AppointmentStatus.PENDING]: "warning",
    [AppointmentStatus.CONFIRMED]: "info",
    [AppointmentStatus.CHECKED_IN]: "primary",
    [AppointmentStatus.IN_PROGRESS]: "warning",
    [AppointmentStatus.COMPLETED]: "success",
    [AppointmentStatus.CANCELLED]: "error",
    [AppointmentStatus.NO_SHOW]: "light",
    [AppointmentStatus.RESCHEDULED]: "info",
  };
  return colorMap[status] || "light";
};

const getPaymentBadgeColor = (status?: PaymentStatus) => {
  if (!status) return "light";
  const colorMap: Record<PaymentStatus, "success" | "warning" | "info"> = {
    [PaymentStatus.PAID]: "success",
    [PaymentStatus.PENDING]: "warning",
    [PaymentStatus.REFUNDED]: "info",
  };
  return colorMap[status];
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "-";
  return timeStr.substring(0, 5);
};

const formatCurrency = (amount?: number) => {
  if (!amount) return "-";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

// =========== ICONS ===========
const CopyIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const BackIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const DoctorIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const QueueIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const PaymentIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MessageIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className={`h-5 w-5 ${filled ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

// =========== CARD COMPONENT ===========
interface CardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, icon, children, className = "" }) => (
  <div className={`rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800 ${className}`}>
    <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
      {icon && <span className="text-brand-500">{icon}</span>}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    {children}
  </div>
);

// =========== INFO ROW COMPONENT ===========
interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, className = "" }) => (
  <div className={`flex justify-between py-2 ${className}`}>
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
  </div>
);

// =========== TAB COMPONENT ===========
interface TabProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

const TabNav: React.FC<TabProps> = ({ tabs, activeTab, onChange }) => (
  <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
    <nav className="-mb-px flex space-x-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "border-brand-500 text-brand-500"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  </div>
);

// =========== TIMELINE COMPONENT ===========
interface TimelineItemProps {
  item: AppointmentHistoryDTO;
  isLast: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ item, isLast }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-400">
        <HistoryIcon />
      </div>
      {!isLast && <div className="h-full w-0.5 bg-gray-200 dark:bg-gray-700" />}
    </div>
    <div className="flex-1 pb-6">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 dark:text-white">{item.action}</h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(item.createdAt)}</span>
      </div>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        By: {item.changedByUserName}
      </p>
      {item.previousStatus && item.newStatus && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <Badge size="sm" color={getStatusBadgeColor(item.previousStatus)}>{item.previousStatus}</Badge>
          <span className="text-gray-400">→</span>
          <Badge size="sm" color={getStatusBadgeColor(item.newStatus)}>{item.newStatus}</Badge>
        </div>
      )}
      {item.notes && (
        <p className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
          {item.notes}
        </p>
      )}
    </div>
  </div>
);

// =========== MAIN COMPONENT ===========
export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appointmentId = parseInt(id || "0");

  // Data states
  const [appointment, setAppointment] = useState<AppointmentDetailDTO | null>(null);
  const [history, setHistory] = useState<AppointmentHistoryDTO[]>([]);
  const [communications, setCommunications] = useState<CommunicationDTO[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionDTO[]>([]);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecordDTO | null>(null);
  const [payments, setPayments] = useState<PaymentRecordDTO[]>([]);
  const [review, setReview] = useState<ReviewDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // UI states
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  // Modal states
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [noShowModalOpen, setNoShowModalOpen] = useState(false);
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState(false);

  // Form states
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleData, setRescheduleData] = useState<RescheduleDTO>({
    newDate: "",
    newStartTime: "",
    newEndTime: "",
    reason: "",
  });
  const [noShowReason, setNoShowReason] = useState("");
  const [messageChannel, setMessageChannel] = useState<"EMAIL" | "SMS">("EMAIL");
  const [customMessage, setCustomMessage] = useState("");

  // =========== FETCH DATA ===========
  const fetchAppointmentDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getAppointmentDetail(appointmentId);
      setAppointment(data);
    } catch (error) {
      console.error("Failed to fetch appointment detail:", error);
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await appointmentService.getAppointmentHistory(appointmentId);
      setHistory(data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setHistory([]);
    }
  }, [appointmentId]);

  const fetchCommunications = useCallback(async () => {
    try {
      const data = await appointmentService.getAppointmentCommunications(appointmentId);
      setCommunications(data);
    } catch (error) {
      console.error("Failed to fetch communications:", error);
      setCommunications([]);
    }
  }, [appointmentId]);

  const fetchRelatedRecords = useCallback(async () => {
    try {
      // Use the optimized method that fetches all records in one API call
      const relatedData = await appointmentService.getRelatedRecords(appointmentId);
      setPrescriptions(relatedData.prescriptions);
      setMedicalRecord(relatedData.medicalRecord);
      setPayments(relatedData.payments);
      setReview(relatedData.review);
    } catch (error) {
      console.error("Failed to fetch related records:", error);
      setPrescriptions([]);
      setMedicalRecord(null);
      setPayments([]);
      setReview(null);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchAppointmentDetail();
  }, [fetchAppointmentDetail]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    } else if (activeTab === "communications") {
      fetchCommunications();
    } else if (activeTab === "related") {
      fetchRelatedRecords();
    }
  }, [activeTab, fetchHistory, fetchCommunications, fetchRelatedRecords]);

  // =========== HANDLERS ===========
  const handleCopyCode = () => {
    if (appointment) {
      copyToClipboard(appointment.appointmentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReschedule = async () => {
    try {
      await appointmentService.rescheduleAppointment(appointmentId, rescheduleData);
      setRescheduleModalOpen(false);
      setRescheduleData({ newDate: "", newStartTime: "", newEndTime: "", reason: "" });
      fetchAppointmentDetail();
      fetchHistory();
    } catch (error: any) {
      console.error("Failed to reschedule:", error);
      const errorMsg = error?.response?.data?.message || "Failed to reschedule appointment";
      alert(errorMsg);
    }
  };

  const handleCancel = async () => {
    try {
      await appointmentService.cancelAppointment(appointmentId, { reason: cancelReason });
      setCancelModalOpen(false);
      setCancelReason("");
      fetchAppointmentDetail();
      fetchHistory();
    } catch (error: any) {
      console.error("Failed to cancel:", error);
      const errorMsg = error?.response?.data?.message || "Failed to cancel appointment";
      alert(errorMsg);
    }
  };

  // Check-in time window: 30 min before → 15 min after appointment start
  const isCheckInWindowOpen = (() => {
    if (!appointment) return false;
    const now = new Date();
    const [h, m] = (appointment.startTime || "00:00").split(":").map(Number);
    const aptDate = new Date(appointment.appointmentDate);
    aptDate.setHours(h, m, 0, 0);
    const diffMin = (aptDate.getTime() - now.getTime()) / 60000;
    return diffMin <= 30 && diffMin >= -15;
  })();

  const getCheckInTooltip = (): string | null => {
    if (!appointment) return null;
    const now = new Date();
    const [h, m] = (appointment.startTime || "00:00").split(":").map(Number);
    const aptDate = new Date(appointment.appointmentDate);
    aptDate.setHours(h, m, 0, 0);
    const diffMin = Math.round((aptDate.getTime() - now.getTime()) / 60000);
    if (diffMin > 30) return `Check-in opens in ${diffMin - 30} min (30 min before appointment)`;
    if (diffMin < -15) return `Check-in window closed ${Math.abs(diffMin) - 15} min ago`;
    return null;
  };

  const handleCheckIn = async () => {
    try {
      await appointmentService.checkInPatient(appointmentId);
      fetchAppointmentDetail();
      fetchHistory();
    } catch (error: any) {
      console.error("Failed to check in:", error);
      const errorMsg = error?.response?.data?.message || "Failed to check in patient";
      alert(errorMsg);
    }
  };

  const handleMarkNoShow = async () => {
    try {
      await appointmentService.markAsNoShow(appointmentId, { reason: noShowReason });
      setNoShowModalOpen(false);
      setNoShowReason("");
      fetchAppointmentDetail();
      fetchHistory();
    } catch (error: any) {
      console.error("Failed to mark as no-show:", error);
      const errorMsg = error?.response?.data?.message || "Failed to mark as no-show";
      alert(errorMsg);
    }
  };

  const handleSendReminder = async () => {
    try {
      await appointmentService.sendReminder([appointmentId]);
      alert("Reminder sent successfully");
    } catch (error) {
      console.error("Failed to send reminder:", error);
      alert("Failed to send reminder");
    }
  };

  const handleSendCustomMessage = async () => {
    try {
      const result = await appointmentService.sendCustomMessage(appointmentId, {
        messageType: messageChannel,
        message: customMessage,
      });
      setSendMessageModalOpen(false);
      setCustomMessage("");
      fetchCommunications();
      alert(result?.message || "Message sent successfully");
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMsg = error?.response?.data?.message || "Failed to send message";
      alert(errorMsg);
    }
  };

  const handleResendCommunication = async (commId: number) => {
    try {
      await appointmentService.resendCommunication(appointmentId, commId);
      fetchCommunications();
    } catch (error) {
      console.error("Failed to resend:", error);
      alert("Failed to resend communication");
    }
  };

  const handleExportHistoryPDF = async () => {
    try {
      const blob = await appointmentService.exportHistoryToPDF(appointmentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointment_${appointment?.appointmentCode}_history.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export:", error);
      alert("Export feature requires backend implementation");
    }
  };

  // =========== TAB DEFINITIONS ===========
  const tabs = [
    { id: "overview", label: "Overview", icon: <DocumentIcon /> },
    { id: "history", label: "History", icon: <HistoryIcon /> },
    { id: "communications", label: "Communications", icon: <MessageIcon /> },
    { id: "related", label: "Related Records", icon: <LinkIcon /> },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-gray-500">Appointment not found</p>
        <button
          onClick={() => navigate("/appointment-list")}
          className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-white hover:bg-brand-600"
        >
          Back to List
        </button>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Appointment ${appointment.appointmentCode} | MedicalTech`}
        description="Appointment detail page"
      />
      <PageBreadcrumb pageTitle="Appointment Detail" />

      {/* Header with Back Button and Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate("/appointment-list")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <BackIcon />
          Back to Appointments
        </button>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {(appointment.status === AppointmentStatus.CONFIRMED || appointment.status === AppointmentStatus.PENDING) && (
            <button
              onClick={handleCheckIn}
              disabled={!isCheckInWindowOpen}
              title={getCheckInTooltip() || "Check-in patient"}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                isCheckInWindowOpen
                  ? "bg-purple-500 hover:bg-purple-600 cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed opacity-60"
              }`}
            >
              Check-in Patient
            </button>
          )}
          {![AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW].includes(appointment.status) && (
            <>
              {/* Reschedule: only PENDING, CONFIRMED, CHECKED_IN (admin can reschedule CHECKED_IN) */}
              {[AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN].includes(appointment.status) && (
                <button
                  onClick={() => {
                    setRescheduleData({
                      newDate: appointment.appointmentDate,
                      newStartTime: formatTime(appointment.startTime),
                      newEndTime: formatTime(appointment.endTime),
                      reason: "",
                    });
                    setRescheduleModalOpen(true);
                  }}
                  className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
                >
                  Reschedule
                </button>
              )}
              <button
                onClick={() => setCancelModalOpen(true)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Cancel
              </button>
              <button
                onClick={() => setNoShowModalOpen(true)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Mark No-Show
              </button>
            </>
          )}
          <button
            onClick={handleSendReminder}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Send Reminder
          </button>
        </div>
      </div>

      {/* Tabs */}
      <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* Appointment Info Card */}
          <Card title="Appointment Info" icon={<CalendarIcon />}>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Code</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-brand-500">{appointment.appointmentCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    title="Copy code"
                  >
                    <CopyIcon />
                  </button>
                  {copied && <span className="text-xs text-green-500">Copied!</span>}
                </div>
              </div>
              <InfoRow label="Status" value={<Badge color={getStatusBadgeColor(appointment.status)}>{appointment.status}</Badge>} />
              <InfoRow label="Created" value={formatDateTime(appointment.createdAt)} />
              <InfoRow label="Last Updated" value={formatDateTime(appointment.updatedAt)} />
            </div>
          </Card>

          {/* Date & Time Card */}
          <Card title="Date & Time" icon={<ClockIcon />}>
            <div className="space-y-1">
              <InfoRow label="Date" value={formatDate(appointment.appointmentDate)} />
              <InfoRow label="Start Time" value={formatTime(appointment.startTime)} />
              <InfoRow label="End Time" value={formatTime(appointment.endTime)} />
              <InfoRow label="Duration" value={`${appointment.duration || 30} minutes`} />
              {appointment.timeSlotId && <InfoRow label="Time Slot ID" value={`#${appointment.timeSlotId}`} />}
            </div>
          </Card>

          {/* Patient Info Card */}
          <Card title="Patient Information" icon={<UserIcon />}>
            <div className="mb-4 flex items-center gap-4">
              <img
                src={appointment.patientAvatar || "/images/user/user-default.jpg"}
                alt={appointment.patientName}
                className="h-16 w-16 rounded-full object-cover"
              />
              <div>
                <Link
                  to={`/patients/${appointment.patientId}`}
                  className="text-lg font-semibold text-brand-500 hover:underline"
                >
                  {appointment.patientName}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400">Patient ID: #{appointment.patientId}</p>
              </div>
            </div>
            <div className="space-y-1">
              <InfoRow label="Email" value={appointment.patientEmail} />
              <InfoRow label="Phone" value={appointment.patientPhone} />
              {appointment.patientDob && <InfoRow label="Date of Birth" value={formatDate(appointment.patientDob)} />}
              {appointment.patientGender && <InfoRow label="Gender" value={appointment.patientGender} />}
            </div>
            <Link
              to={`/patients/${appointment.patientId}/medical-history`}
              className="mt-4 block text-center text-sm text-brand-500 hover:underline"
            >
              View Medical History →
            </Link>
          </Card>

          {/* Doctor Info Card */}
          <Card title="Doctor Information" icon={<DoctorIcon />}>
            <div className="mb-4 flex items-center gap-4">
              <img
                src={appointment.doctorAvatar || "/images/user/user-default.jpg"}
                alt={appointment.doctorName}
                className="h-16 w-16 rounded-full object-cover"
              />
              <div>
                <Link
                  to={`/doctors/${appointment.doctorId}`}
                  className="text-lg font-semibold text-brand-500 hover:underline"
                >
                  {appointment.doctorName}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.doctorSpecialization}</p>
              </div>
            </div>
            <div className="space-y-1">
              <InfoRow label="Email" value={appointment.doctorEmail} />
              {appointment.doctorPhone && <InfoRow label="Phone" value={appointment.doctorPhone} />}
              {appointment.doctorExperience && <InfoRow label="Experience" value={`${appointment.doctorExperience} years`} />}
              <InfoRow label="Consultation Fee" value={formatCurrency(appointment.doctorConsultationFee)} />
            </div>
          </Card>

          {/* Details Card */}
          <Card title="Appointment Details" icon={<DocumentIcon />}>
            <div className="space-y-1">
              <InfoRow
                label="Type"
                value={<Badge size="sm" variant="light" color="primary">{appointment.appointmentType || "CONSULTATION"}</Badge>}
              />
              <div className="py-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Reason for Visit</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{appointment.reasonForVisit || "-"}</p>
              </div>
              <div className="py-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Symptoms</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{appointment.symptoms || "-"}</p>
              </div>
              <div className="py-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">Patient Notes</p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{appointment.notes || "-"}</p>
              </div>
              {appointment.status === AppointmentStatus.COMPLETED && (
                <>
                  <div className="py-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Doctor Notes</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{appointment.doctorNotes || "-"}</p>
                  </div>
                  <div className="py-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Diagnosis</p>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{appointment.diagnosis || "-"}</p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Queue Info Card (if checked-in) */}
          {appointment.queueNumber && (
            <Card title="Queue Information" icon={<QueueIcon />}>
              <div className="mb-4 flex items-center justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                  <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">{appointment.queueNumber}</span>
                </div>
              </div>
              <div className="space-y-1">
                <InfoRow label="Check-in Time" value={formatDateTime(appointment.checkedInAt || "")} />
                <InfoRow label="Checked-in By" value={appointment.checkedInBy || "-"} />
                {appointment.estimatedWaitTime && (
                  <InfoRow label="Est. Wait Time" value={`${appointment.estimatedWaitTime} minutes`} />
                )}
              </div>
            </Card>
          )}

          {/* Payment Info Card */}
          <Card title="Payment Information" icon={<PaymentIcon />}>
            <div className="space-y-1">
              <InfoRow
                label="Status"
                value={<Badge color={getPaymentBadgeColor(appointment.paymentStatus)}>{appointment.paymentStatus || "PENDING"}</Badge>}
              />
              <InfoRow label="Amount" value={formatCurrency(appointment.paymentAmount)} />
              <InfoRow label="Method" value={appointment.paymentMethod || "-"} />
              <InfoRow label="Payment Date" value={formatDateTime(appointment.paymentDate || "")} />
            </div>
            {appointment.paymentId && (
              <Link
                to={`/payments/${appointment.paymentId}`}
                className="mt-4 block text-center text-sm text-brand-500 hover:underline"
              >
                View Payment Detail →
              </Link>
            )}
          </Card>
        </div>
      )}

      {activeTab === "history" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appointment History</h3>
            <button
              onClick={handleExportHistoryPDF}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
            >
              <DocumentIcon />
              Export to PDF
            </button>
          </div>

          {history.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">No history records found</p>
          ) : (
            <div className="space-y-0">
              {history.map((item, index) => (
                <TimelineItem key={item.id} item={item} isLast={index === history.length - 1} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "communications" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Communications</h3>
            <button
              onClick={() => setSendMessageModalOpen(true)}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Send Custom Message
            </button>
          </div>

          {communications.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <MessageIcon />
              <p className="mt-2 text-gray-500 dark:text-gray-400">No communications sent yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {communications.map((comm) => (
                <div
                  key={comm.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        comm.channel === "EMAIL" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                      }`}>
                        {comm.channel === "EMAIL" ? <MessageIcon /> : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{comm.type}</span>
                          <Badge size="sm" color={comm.channel === "EMAIL" ? "info" : "success"}>{comm.channel}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">To: {comm.recipient}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        size="sm"
                        color={
                          comm.status === "DELIVERED" ? "success" :
                          comm.status === "SENT" ? "info" :
                          comm.status === "FAILED" ? "error" : "warning"
                        }
                      >
                        {comm.status}
                      </Badge>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(comm.sentAt || comm.createdAt)}
                      </p>
                    </div>
                  </div>
                  {comm.subject && (
                    <p className="mt-3 font-medium text-gray-800 dark:text-gray-200">Subject: {comm.subject}</p>
                  )}
                  <p className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                    {comm.content}
                  </p>
                  {comm.status === "FAILED" && (
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm text-red-500">Failure reason: {comm.failureReason || "Unknown error"}</p>
                      <button
                        onClick={() => handleResendCommunication(comm.id)}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                      >
                        Resend
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "related" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Prescriptions */}
          <Card title="Prescriptions" icon={<DocumentIcon />}>
            {prescriptions.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No prescriptions found</p>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((prescription) => (
                  <Link
                    key={prescription.id}
                    to={`/prescriptions/${prescription.id}`}
                    className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-brand-500">{prescription.prescriptionCode}</span>
                      <Badge size="sm" color={prescription.status === "ACTIVE" ? "success" : "light"}>
                        {prescription.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {prescription.medications.length} medications • {formatDate(prescription.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Medical Record */}
          <Card title="Medical Record" icon={<DocumentIcon />}>
            {!medicalRecord ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No medical record found</p>
            ) : (
              <Link
                to={`/medical-records/${medicalRecord.id}`}
                className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-brand-500">{medicalRecord.recordCode}</span>
                  <span className="text-sm text-gray-500">{formatDate(medicalRecord.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <strong>Diagnosis:</strong> {medicalRecord.diagnosis}
                </p>
              </Link>
            )}
          </Card>

          {/* Payments */}
          <Card title="Payment Records" icon={<PaymentIcon />}>
            {payments.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No payment records found</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <Link
                    key={payment.id}
                    to={`/payments/${payment.id}`}
                    className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-brand-500">{payment.paymentCode}</span>
                      <Badge size="sm" color={getPaymentBadgeColor(payment.status)}>{payment.status}</Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{payment.method}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</span>
                    </div>
                    {payment.invoiceUrl && (
                      <a
                        href={payment.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm text-brand-500 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Download Invoice →
                      </a>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Review */}
          <Card title="Patient Review" icon={<StarIcon filled />}>
            {!review ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No review submitted yet</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} filled={star <= review.rating} />
                  ))}
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{review.rating}/5</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    By: {review.isAnonymous ? "Anonymous" : review.patientName}
                  </span>
                  <Badge size="sm" color={
                    review.status === "APPROVED" ? "success" :
                    review.status === "REJECTED" ? "error" : "warning"
                  }>
                    {review.status}
                  </Badge>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal isOpen={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} className="max-w-md">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Reschedule Appointment</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newDate">New Date</Label>
              <input
                id="newDate"
                type="date"
                value={rescheduleData.newDate}
                onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newStartTime">Start Time</Label>
                <input
                  id="newStartTime"
                  type="time"
                  value={rescheduleData.newStartTime}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newStartTime: e.target.value })}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="newEndTime">End Time</Label>
                <input
                  id="newEndTime"
                  type="time"
                  value={rescheduleData.newEndTime}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newEndTime: e.target.value })}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="rescheduleReason">Reason</Label>
              <textarea
                id="rescheduleReason"
                value={rescheduleData.reason}
                onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="sendNotification" className="h-4 w-4 rounded border-gray-300" defaultChecked />
              <label htmlFor="sendNotification" className="text-sm text-gray-700 dark:text-gray-300">Send notification to patient</label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} className="max-w-md">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Cancel Appointment</h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancelReason">Cancellation Reason *</Label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
              />
            </div>
            {appointment.paymentStatus === PaymentStatus.PAID && (
              <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/30">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This appointment has been paid. A refund may be processed according to the cancellation policy.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="sendCancelNotification" className="h-4 w-4 rounded border-gray-300" defaultChecked />
              <label htmlFor="sendCancelNotification" className="text-sm text-gray-700 dark:text-gray-300">Send notification to patient</label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Close
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim()}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* No-Show Modal */}
      <Modal isOpen={noShowModalOpen} onClose={() => setNoShowModalOpen(false)} className="max-w-md">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Mark as No-Show</h2>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to mark this appointment as a no-show? This indicates the patient did not attend.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="noShowReason">Reason *</Label>
              <textarea
                id="noShowReason"
                value={noShowReason}
                onChange={(e) => setNoShowReason(e.target.value)}
                rows={3}
                placeholder="Enter the reason for no-show..."
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setNoShowModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkNoShow}
                disabled={!noShowReason.trim()}
                className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50"
              >
                Mark as No-Show
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Send Message Modal */}
      <Modal isOpen={sendMessageModalOpen} onClose={() => setSendMessageModalOpen(false)} className="max-w-md">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Send Custom Message</h2>
          <div className="space-y-4">
            <div>
              <Label>Channel</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="channel"
                    value="EMAIL"
                    checked={messageChannel === "EMAIL"}
                    onChange={() => setMessageChannel("EMAIL")}
                    className="h-4 w-4 text-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="channel"
                    value="SMS"
                    checked={messageChannel === "SMS"}
                    onChange={() => setMessageChannel("SMS")}
                    className="h-4 w-4 text-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">SMS</span>
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="customMessage">Message</Label>
              <textarea
                id="customMessage"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={5}
                placeholder="Enter your message here..."
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setSendMessageModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSendCustomMessage}
                disabled={!customMessage.trim()}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
