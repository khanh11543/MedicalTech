import { useEffect, useState, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import patientService, { type Payment } from "../../services/patientService";

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING: { label: "Pending", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  PAID: { label: "Paid", classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  FAILED: { label: "Failed", classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  REFUNDED: { label: "Refunded", classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  PARTIALLY_REFUNDED: { label: "Partial Refund", classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  CANCELLED: { label: "Cancelled", classes: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400" },
};

const statusFilters = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await patientService.getMyPayments({
        status: statusFilter || undefined,
        pageNumber: page,
        pageSize: 10,
      });
      setPayments(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return (
    <>
      <PageMeta title="Payment History | MedicalTech" description="View your payment history" />

      {selectedPayment && (
        <PaymentDetailModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}

      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payment History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totalElements} payment{totalElements !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(0); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                statusFilter === f.value
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Payment List */}
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
              {statusFilter ? "Try a different filter" : "Your payments will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => {
              const sc = statusConfig[payment.paymentStatus] || statusConfig.PENDING;
              return (
                <div
                  key={payment.id}
                  onClick={() => setSelectedPayment(payment)}
                  className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/50 p-4 sm:p-5 hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                          {payment.paymentCode}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.classes}`}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Appointment: {payment.appointmentCode} • {payment.paymentMethod || "N/A"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(payment.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-gray-800 dark:text-white">
                        {payment.totalAmount?.toLocaleString("vi-VN")} VND
                      </p>
                      {payment.paidAt && (
                        <p className="text-[10px] text-emerald-500 mt-0.5">
                          Paid {new Date(payment.paidAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
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

function PaymentDetailModal({ payment: p, onClose }: { payment: Payment; onClose: () => void }) {
  const sc = statusConfig[p.paymentStatus] || statusConfig.PENDING;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
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
              <span className="text-gray-800 dark:text-white">{p.amount?.toLocaleString("vi-VN")} VND</span>
            </div>
            {p.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-emerald-500">-{p.discountAmount?.toLocaleString("vi-VN")} VND</span>
              </div>
            )}
            {p.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-800 dark:text-white">{p.taxAmount?.toLocaleString("vi-VN")} VND</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-600 pt-2.5">
              <span className="text-gray-800 dark:text-white">Total</span>
              <span className="text-blue-600 dark:text-blue-400">{p.totalAmount?.toLocaleString("vi-VN")} VND</span>
            </div>
          </div>

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
                {p.refundAmount?.toLocaleString("vi-VN")} VND
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
