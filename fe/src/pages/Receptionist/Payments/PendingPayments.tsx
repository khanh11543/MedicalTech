import { useState, useCallback, useEffect } from "react";
import receptionistService from "../../../services/receptionistService";
import type { PendingPaymentDTO } from "../../../services/receptionistService";
import { Modal } from "../../../components/ui/modal";

// ==================== HELPERS ====================

const URGENCY_STYLES: Record<string, { badge: string; label: string }> = {
  HIGH: {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 ring-1 ring-red-300 dark:ring-red-800",
    label: "High",
  },
  MEDIUM: {
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 ring-1 ring-yellow-300 dark:ring-yellow-800",
    label: "Medium",
  },
  LOW: {
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ring-1 ring-green-300 dark:ring-green-800",
    label: "Low",
  },
};

const formatCurrency = (amount: number | undefined | null) => {
  if (!amount) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function PendingPayments() {
  // Data
  const [pendingPayments, setPendingPayments] = useState<PendingPaymentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 15;
  const [searchQuery, setSearchQuery] = useState("");

  // Send link modal
  const [showSendLink, setShowSendLink] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PendingPaymentDTO | null>(null);
  const [sendVia, setSendVia] = useState<"EMAIL" | "SMS" | "BOTH">("EMAIL");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

  // ==================== FETCH ====================

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const data = await receptionistService.getPendingPayments({
        search: searchQuery || undefined,
        page,
        size: pageSize,
        sortBy: "daysPending",
        sortDir: "DESC",
      });
      setPendingPayments(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (error) {
      console.error("Failed to fetch pending payments:", error);
      setPendingPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // ==================== ACTIONS ====================

  const handleOpenSendLink = (payment: PendingPaymentDTO) => {
    setSelectedPayment(payment);
    setSendVia("EMAIL");
    setCustomMessage("");
    setShowSendLink(true);
  };

  const handleSendLink = async () => {
    if (!selectedPayment) return;
    setSending(true);
    try {
      await receptionistService.sendPaymentLink(selectedPayment.paymentId, {
        sendVia,
        customMessage: customMessage || undefined,
      });
      setShowSendLink(false);
      // Refresh data to update reminder count
      fetchPending();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to send link";
      alert("Send failed: " + msg);
    } finally {
      setSending(false);
    }
  };

  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + (p.amountDue || 0), 0);

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">Total Pending Payments</p>
            <p className="text-3xl font-bold mt-1">{totalElements}</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm font-medium">Total Amount Due</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalPendingAmount)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              placeholder="Search by patient name, phone, appointment code..."
              className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => fetchPending()}
            className="px-5 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Pending Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingPayments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">All caught up!</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No pending payments at the moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Appointment</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Doctor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount Due</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Days Pending</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Urgency</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Completed At</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Reminders</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {pendingPayments.map((p) => {
                  const urgency = URGENCY_STYLES[p.urgencyLevel] || URGENCY_STYLES.LOW;
                  return (
                    <tr key={p.paymentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-brand-500 text-xs">{p.appointmentCode}</span>
                        <span className="block text-xs text-gray-400 mt-0.5">{p.paymentCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-900 dark:text-white font-medium">{p.patientName}</span>
                        <span className="block text-xs text-gray-400">{p.maskedPhone}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.doctorName}</td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{formatCurrency(p.amountDue)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${p.daysPending > 3 ? "text-red-600" : p.daysPending > 1 ? "text-yellow-600" : "text-gray-600 dark:text-gray-300"}`}>
                          {p.daysPending}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${urgency.badge}`}>
                          {urgency.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{formatDate(p.completedAt)}</td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600 dark:text-gray-300 text-xs">
                          {p.reminderCount > 0 ? `${p.reminderCount} sent` : "None"}
                        </span>
                        {p.lastReminderSent && (
                          <span className="block text-xs text-gray-400">Last: {formatDate(p.lastReminderSent)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleOpenSendLink(p)}
                          className="px-3 py-1.5 text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors font-medium"
                        >
                          Send Link
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            ← Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const pNum = page < 3 ? i : page - 2 + i;
            if (pNum >= totalPages) return null;
            return (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                className={`px-3 py-1.5 text-sm rounded-lg border ${
                  page === pNum
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {pNum + 1}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Next →
          </button>
        </div>
      )}

      {/* ==================== SEND LINK MODAL ==================== */}
      <Modal isOpen={showSendLink} onClose={() => setShowSendLink(false)} className="max-w-md p-6 mx-4">
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Send Payment Link</h2>
            {selectedPayment && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <p>{selectedPayment.patientName} • {selectedPayment.appointmentCode}</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(selectedPayment.amountDue)}</p>
              </div>
            )}
          </div>

          {/* Send via */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Send via</label>
            <div className="flex gap-2">
              {(["EMAIL", "SMS", "BOTH"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSendVia(v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    sendVia === v
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {v === "EMAIL" ? "Email" : v === "SMS" ? "SMS" : "Both"}
                </button>
              ))}
            </div>
          </div>

          {/* Custom message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom message (optional)</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a custom message to the payment link notification..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSendLink}
              disabled={sending}
              className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {sending ? "Sending..." : "Send Payment Link"}
            </button>
            <button
              onClick={() => setShowSendLink(false)}
              className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
