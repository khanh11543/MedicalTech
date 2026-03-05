import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import receptionistService from "../../../services/receptionistService";
import type {
  ReceptionistAppointmentDetailDTO,
  CommunicationLogDTO,
  DocumentSummaryDTO,
  NotificationTemplateDTO,
} from "../../../services/receptionistService";
import { StatusBadge, PaymentBadge, Toast, ConfirmDialog, Spinner } from "./SharedComponents";
import { ACTIONS_PER_STATUS } from "./constants";
import { useWorkstation } from "../../../context/WorkstationContext";
import { maskEmail } from "../../../utils/privacyMask";

type DetailTab = "overview" | "communications" | "documents";

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<ReceptionistAppointmentDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Communications
  const [commLogs, setCommLogs] = useState<CommunicationLogDTO[]>([]);
  const [commLoading, setCommLoading] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplateDTO[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [sendChannel, setSendChannel] = useState("EMAIL");
  const [sending, setSending] = useState(false);

  // Documents
  const [documents, setDocuments] = useState<DocumentSummaryDTO[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // Action dialogs
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const appointmentId = Number(id);
  const { settings: wsSettings } = useWorkstation();

  const fetchDetail = useCallback(async () => {
    if (!appointmentId) return;
    try {
      setLoading(true);
      const data = await receptionistService.getAppointmentDetail(appointmentId);
      setDetail(data);
    } catch (error) {
      console.error("Failed to fetch detail:", error);
      setToast({ message: "Failed to load appointment details", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Load communications when tab switches
  useEffect(() => {
    if (activeTab === "communications" && appointmentId) {
      const loadComms = async () => {
        try {
          setCommLoading(true);
          const [logs, tmpls] = await Promise.all([
            receptionistService.getCommunicationLogs(appointmentId),
            receptionistService.getNotificationTemplates().catch(() => []),
          ]);
          setCommLogs(logs);
          setTemplates(tmpls);
        } catch {
          setCommLogs([]);
        } finally {
          setCommLoading(false);
        }
      };
      loadComms();
    }
  }, [activeTab, appointmentId]);

  // Load documents when tab switches
  useEffect(() => {
    if (activeTab === "documents" && appointmentId) {
      const loadDocs = async () => {
        try {
          setDocsLoading(true);
          const docs = await receptionistService.getDocuments(appointmentId);
          setDocuments(docs);
        } catch {
          setDocuments([]);
        } finally {
          setDocsLoading(false);
        }
      };
      loadDocs();
    }
  }, [activeTab, appointmentId]);

  // Actions
  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      await receptionistService.confirmAppointment(appointmentId);
      setToast({ message: "Appointment confirmed", type: "success" });
      fetchDetail();
    } catch {
      setToast({ message: "Confirmation failed", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      await receptionistService.checkInPatient(appointmentId);
      setToast({ message: "Patient checked in", type: "success" });
      fetchDetail();
    } catch {
      setToast({ message: "Check-in failed", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    try {
      setActionLoading(true);
      await receptionistService.cancelAppointment(appointmentId, { reason: cancelReason.trim() });
      setToast({ message: "Appointment cancelled", type: "success" });
      setCancelDialogOpen(false);
      setCancelReason("");
      fetchDetail();
    } catch {
      setToast({ message: "Cancellation failed", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReminder = async () => {
    try {
      setActionLoading(true);
      await receptionistService.sendReminder(appointmentId, "EMAIL");
      setToast({ message: "Reminder sent", type: "success" });
    } catch {
      setToast({ message: "Failed to send reminder", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintSlip = async () => {
    try {
      const blob = await receptionistService.printCheckInSlip(appointmentId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      setToast({ message: "Failed to print slip", type: "error" });
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate) {
      setToast({ message: "Please select a template", type: "info" });
      return;
    }
    try {
      setSending(true);
      await receptionistService.sendTemplateMessage(appointmentId, sendChannel, selectedTemplate);
      setToast({ message: "Message sent", type: "success" });
      // Refresh logs
      const logs = await receptionistService.getCommunicationLogs(appointmentId);
      setCommLogs(logs);
      setSelectedTemplate("");
    } catch {
      setToast({ message: "Failed to send message", type: "error" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Spinner />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Appointment not found</p>
        <button onClick={() => navigate("/receptionist/appointments")} className="mt-4 text-brand-600 dark:text-brand-400 hover:underline">
          Back to list
        </button>
      </div>
    );
  }

  const { patient, appointment, doctor, payment, allowedActions } = detail;
  const actions = allowedActions || ACTIONS_PER_STATUS[detail.status] || [];

  const tabs: { key: DetailTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "communications", label: "Communications" },
    { key: "documents", label: "Documents" },
  ];

  return (
    <div className="space-y-6">
      {/* Back nav + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/receptionist/appointments")}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{detail.appointmentCode}</h1>
            <StatusBadge status={detail.status} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created {new Date(detail.createdAt).toLocaleDateString()} by {detail.createdByName || detail.bookedBy || "System"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {actions.includes("CONFIRM") && (
            <button onClick={handleConfirm} disabled={actionLoading} className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              Confirm
            </button>
          )}
          {actions.includes("CHECK_IN") && (
            <button onClick={handleCheckIn} disabled={actionLoading} className="px-3 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors">
              Check In
            </button>
          )}
          {actions.includes("SEND_REMINDER") && (
            <button onClick={handleSendReminder} disabled={actionLoading} className="px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 disabled:opacity-50 transition-colors">
              Send Reminder
            </button>
          )}
          {actions.includes("PRINT_SLIP") && (
            <button onClick={handlePrintSlip} className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Print Slip
            </button>
          )}
          {actions.includes("CANCEL") && (
            <button onClick={() => setCancelDialogOpen(true)} disabled={actionLoading} className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Patient Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Patient</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{patient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Phone</span>
                <span className="text-sm text-gray-900 dark:text-white">{patient.maskedPhone}</span>
              </div>
              {patient.email && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                  <span className="text-sm text-gray-900 dark:text-white">{wsSettings.hideEmail ? maskEmail(patient.email) : patient.email}</span>
                </div>
              )}
              {patient.mrn && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">MRN</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">{patient.mrn}</span>
                </div>
              )}
              {patient.gender && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Gender</span>
                  <span className="text-sm text-gray-900 dark:text-white">{patient.gender}</span>
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">DOB</span>
                  <span className="text-sm text-gray-900 dark:text-white">{patient.dateOfBirth}</span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Appointment</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{appointment.appointmentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Time</span>
                <span className="text-sm text-gray-900 dark:text-white">{appointment.startTime} – {appointment.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Duration</span>
                <span className="text-sm text-gray-900 dark:text-white">{appointment.durationMinutes} min</span>
              </div>
              {appointment.type && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
                  <span className="text-sm text-gray-900 dark:text-white">{appointment.type}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <StatusBadge status={appointment.status} />
              </div>
              {appointment.queueNumber && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Queue</span>
                  <span className="inline-flex items-center justify-center w-7 h-7 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-sm font-bold">{appointment.queueNumber}</span>
                </div>
              )}
              {appointment.checkedInAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Checked In</span>
                  <span className="text-sm text-green-600 dark:text-green-400">{new Date(appointment.checkedInAt).toLocaleTimeString()}</span>
                </div>
              )}
              {appointment.adminNotes && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Admin Notes</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{appointment.adminNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Doctor Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Doctor</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{doctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Specialization</span>
                <span className="text-sm text-gray-900 dark:text-white">{doctor.specialization}</span>
              </div>
              {doctor.room && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Room</span>
                  <span className="text-sm text-gray-900 dark:text-white">{doctor.room}</span>
                </div>
              )}
              {doctor.consultationFee != null && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Fee</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{doctor.consultationFee.toLocaleString()}₫</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Payment</h3>
            {payment ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{payment.fee.toLocaleString()}₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <PaymentBadge status={payment.paymentStatus} />
                </div>
                {payment.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Method</span>
                    <span className="text-sm text-gray-900 dark:text-white">{payment.paymentMethod}</span>
                  </div>
                )}
                {payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Paid At</span>
                    <span className="text-sm text-gray-900 dark:text-white">{new Date(payment.paidAt).toLocaleString()}</span>
                  </div>
                )}
                {payment.receiptUrl && (
                  <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline mt-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Receipt
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No payment record yet</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "communications" && (
        <div className="space-y-4">
          {/* Send message */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Send Message</h3>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select template...</option>
                  {templates.filter((t) => t.active).map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Channel</label>
                <select
                  value={sendChannel}
                  onChange={(e) => setSendChannel(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="IN_APP">In-App</option>
                </select>
              </div>
              <button
                onClick={handleSendTemplate}
                disabled={sending || !selectedTemplate}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>

          {/* Communication log list */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Communication History</h3>
            </div>
            {commLoading ? (
              <Spinner />
            ) : commLogs.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No communication logs</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {commLogs.map((log) => (
                  <div key={log.id} className="px-5 py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                          log.type === "EMAIL" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : log.type === "SMS" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}>
                          {log.type}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                          log.status === "SENT" || log.status === "DELIVERED" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : log.status === "FAILED" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                          : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(log.sentAt || log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-1">
                      {log.subject && <div className="text-sm font-medium text-gray-900 dark:text-white">{log.subject}</div>}
                      <div className="text-xs text-gray-500 dark:text-gray-400">To: {log.recipient} · By: {log.sentByUserName}</div>
                    </div>
                    {log.errorMessage && (
                      <div className="mt-1 text-xs text-red-500">{log.errorMessage}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Documents</h3>
          </div>
          {docsLoading ? (
            <Spinner />
          ) : documents.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No documents available</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{doc.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{doc.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.exists ? (
                      doc.accessible && doc.downloadUrl ? (
                        <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
                          Download
                        </a>
                      ) : (
                        <span className="px-3 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          {doc.accessible ? "No link" : "Restricted"}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">Not available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cancel dialog */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel ${detail.appointmentCode}?`}
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => { setCancelDialogOpen(false); setCancelReason(""); }}
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
