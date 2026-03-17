import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import patientService, { type Payment, type InvoiceDTO } from "../../services/patientService";
import MomoQrModal from "../../components/payment/MomoQrModal";

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING: { label: "Pending", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  INITIATED: { label: "Processing", classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  PAID: { label: "Paid", classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  FAILED: { label: "Failed", classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  REFUNDED: { label: "Refunded", classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  PARTIALLY_REFUNDED: { label: "Partial Refund", classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  CANCELLED: { label: "Cancelled", classes: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400" },
};

type PaymentTabKey = "PAID" | "UNPAID" | "COMPLETED" | "CANCELLED";
const PAYMENT_TABS: { key: PaymentTabKey; label: string; statusParam: string }[] = [
  { key: "PAID", label: "Paid", statusParam: "PAID" },
  { key: "UNPAID", label: "Unpaid", statusParam: "UNPAID" },
  { key: "COMPLETED", label: "Completed", statusParam: "COMPLETED" },
  { key: "CANCELLED", label: "Cancelled", statusParam: "CANCELLED" },
];

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<PaymentTabKey, number>>({ PAID: 0, UNPAID: 0, COMPLETED: 0, CANCELLED: 0 });
  const [activeTab, setActiveTab] = useState<PaymentTabKey>("UNPAID");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [qrModalPayment, setQrModalPayment] = useState<Payment | null>(null);
  const [cancelModalPayment, setCancelModalPayment] = useState<Payment | null>(null);

  const currentTabConfig = PAYMENT_TABS.find((t) => t.key === activeTab);
  const statusParam = currentTabConfig?.statusParam;

  const fetchPayments = useCallback(async () => {
    if (!statusParam) return;
    setLoading(true);
    try {
      const result = await patientService.getMyPayments({
        status: statusParam,
        pageNumber: page,
        pageSize: 10,
      });
      setPayments(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setTabCounts((prev) => ({ ...prev, [activeTab]: result.totalElements }));
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusParam, activeTab]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handlePaymentUpdated = () => {
    toast.success("Payment successful! Thank you.", { autoClose: 5000 });
    setQrModalPayment(null);
    setCancelModalPayment(null);
    fetchPayments();
  };

  return (
    <>
      <PageMeta title="Payment History | MedicalTech" description="View your payment history" />

      {selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onOpenQr={(p) => { setSelectedPayment(null); setQrModalPayment(p); }}
          onOpenCancel={(p) => { setSelectedPayment(null); setCancelModalPayment(p); }}
        />
      )}

      {qrModalPayment && (
        <MomoQrModal
          payment={qrModalPayment}
          onClose={() => setQrModalPayment(null)}
          onPaymentSuccess={handlePaymentUpdated}
        />
      )}

      {cancelModalPayment && (
        <CancelPaymentModal
          payment={cancelModalPayment}
          onClose={() => setCancelModalPayment(null)}
          onCancelled={handlePaymentUpdated}
        />
      )}

      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payment History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your payment transactions and invoices
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-gray-200 dark:border-gray-700">
          {PAYMENT_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setPage(0); }}
              className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
                activeTab === t.key
                  ? "bg-transparent text-[#049ebb] border-[#049ebb] border-b-2"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
              }`}
            >
              {t.label} {typeof tabCounts[t.key] === "number" && tabCounts[t.key] > 0 ? ` ${tabCounts[t.key]}` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-5 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">No payments found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeTab === "UNPAID" ? "No unpaid payments" : activeTab === "CANCELLED" ? "No cancelled payments" : "Your payments will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const sc = statusConfig[payment.paymentStatus] || statusConfig.PENDING;
              const isPending = payment.paymentStatus === "PENDING" || payment.paymentStatus === "INITIATED";
              const displayDate = payment.appointmentDate
                ? new Date(payment.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : new Date(payment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const specialty = payment.doctorSpecialty || "";
              const subtitle = specialty ? `${specialty} - ${displayDate}` : displayDate;
              return (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 p-4 sm:p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                        Dr. {payment.doctorName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
                      <p className="text-base font-bold text-gray-800 dark:text-white mt-1">
                        {(payment.totalAmount ?? 0).toLocaleString("en-US")} VND
                      </p>
                      {payment.paymentMethod && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          via {payment.paymentMethod === "MOMO" ? "MoMo" : payment.paymentMethod}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.classes}`}>
                        • {payment.paymentStatus === "PAID" && activeTab === "COMPLETED" ? "Completed" : sc.label}
                      </span>
                      <div className="flex gap-2">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => setQrModalPayment(payment)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#049ebb] hover:bg-[#037a94]"
                          >
                            Pay Now
                          </button>
                        )}
                        {payment.paymentStatus === "PAID" && (
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(payment)}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-[#049ebb] border border-[#049ebb] hover:bg-[#049ebb]/10"
                          >
                            Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ============================================================
   CANCEL PAYMENT MODAL
   ============================================================ */
function CancelPaymentModal({
  payment,
  onClose,
  onCancelled,
}: {
  payment: Payment;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCancel = async () => {
    setSubmitting(true);
    setError("");
    try {
      await patientService.cancelMyPayment(payment.id, reason || undefined);
      onCancelled();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel payment";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cancel Payment</h2>
              <p className="text-red-100 text-xs">{payment.paymentCode}</p>
            </div>
          </div>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">
              Are you sure you want to cancel this payment?
            </p>
            <p className="text-xs text-red-500 dark:text-red-400/70 mt-1">
              Amount: <span className="font-bold">{payment.totalAmount?.toLocaleString("en-US")} VND</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Cancellation reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-300 focus:border-red-300 outline-none resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleCancel}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Cancelling..." : "Confirm Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PAYMENT DETAIL MODAL
   ============================================================ */
function PaymentDetailModal({
  payment: p,
  onClose,
  onOpenQr,
  onOpenCancel,
}: {
  payment: Payment;
  onClose: () => void;
  onOpenQr: (p: Payment) => void;
  onOpenCancel: (p: Payment) => void;
}) {
  const sc = statusConfig[p.paymentStatus] || statusConfig.PENDING;
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const isPending = p.paymentStatus === "PENDING" || p.paymentStatus === "INITIATED";

  const handleDownloadInvoice = async () => {
    setInvoiceLoading(true);
    setInvoiceError("");
    try {
      const invoice: InvoiceDTO = await patientService.getInvoiceByPayment(p.id);
      const blob = await patientService.downloadInvoicePdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setInvoiceError("Failed to download invoice.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Payment Details</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sc.classes}`}>
              {sc.label}
            </span>
          </div>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Amount Breakdown */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="text-gray-800 dark:text-white">{p.amount?.toLocaleString("en-US")} VND</span>
            </div>
            {p.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-emerald-500">-{p.discountAmount?.toLocaleString("en-US")} VND</span>
              </div>
            )}
            {p.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-800 dark:text-white">{p.taxAmount?.toLocaleString("en-US")} VND</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-600 pt-2.5">
              <span className="text-gray-800 dark:text-white">Total</span>
              <span className="text-blue-600 dark:text-blue-400">{p.totalAmount?.toLocaleString("en-US")} VND</span>
            </div>
          </div>

          {/* Action Buttons */}
          {isPending && (
            <div className="flex gap-3">
              <button
                onClick={() => onOpenQr(p)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                QR MoMo
              </button>
              <button
                onClick={() => onOpenCancel(p)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Payment
              </button>
            </div>
          )}

          {p.paymentStatus === "PAID" && (
            <button
              onClick={handleDownloadInvoice}
              disabled={invoiceLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              {invoiceLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {invoiceLoading ? "Downloading..." : "Download Invoice"}
            </button>
          )}

          {invoiceError && (
            <p className="text-sm text-red-500 text-center">{invoiceError}</p>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Field label="Payment Code" value={p.paymentCode} />
            <Field label="Appointment" value={p.appointmentCode} />
            <Field label="Method" value={p.paymentMethod || "—"} />
            <Field label="Currency" value={p.currency || "VND"} />
            {p.transactionId && <Field label="Transaction ID" value={p.transactionId} />}
            {p.paidAt && (
              <Field
                label="Paid At"
                value={new Date(p.paidAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              />
            )}
            {p.processedByName && <Field label="Processed By" value={p.processedByName} />}
            <Field
              label="Created"
              value={new Date(p.createdAt).toLocaleString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            />
          </div>

          {/* Refund */}
          {p.refundAmount && p.refundAmount > 0 && (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">Refund</p>
              <p className="text-sm text-gray-800 dark:text-white font-medium">
                {p.refundAmount?.toLocaleString("en-US")} VND
              </p>
              {p.refundReason && (
                <p className="text-xs text-gray-500 mt-1">{p.refundReason}</p>
              )}
            </div>
          )}

          {p.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{p.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm text-gray-800 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}
