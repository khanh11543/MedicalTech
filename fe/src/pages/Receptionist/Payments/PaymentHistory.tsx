import { useState, useCallback, useEffect } from "react";
import receptionistService from "../../../services/receptionistService";
import type { PaymentFullDTO } from "../../../services/receptionistService";
import { Modal } from "../../../components/ui/modal";

// ==================== TYPES ====================

interface PaymentRow {
  id: number;
  paymentCode: string;
  appointmentCode: string;
  patientName: string;
  amount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAt: string;
  processedByName: string;
  createdAt: string;
  appointmentId?: number;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  INITIATED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  REFUNDED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  MOMO: "MoMo",
  TRANSFER: "Transfer",
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

export default function PaymentHistory() {
  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Data
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 15;

  // Receipt modal
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<PaymentFullDTO | null>(null);

  // ==================== FETCH ====================

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const status = statusFilter === "ALL" ? undefined : statusFilter;
      const data = await receptionistService.getPayments(page, pageSize, status);
      const rows: PaymentRow[] = (data?.content || []).map((p: PaymentRow) => ({
        id: p.id,
        paymentCode: p.paymentCode,
        appointmentCode: p.appointmentCode || "",
        patientName: p.patientName || "",
        amount: p.amount || 0,
        totalAmount: p.totalAmount || p.amount || 0,
        paymentMethod: p.paymentMethod || "CASH",
        paymentStatus: p.paymentStatus || "PENDING",
        paidAt: p.paidAt || "",
        processedByName: p.processedByName || "",
        createdAt: p.createdAt || "",
      }));

      // Client-side filters
      let filtered = rows;
      if (methodFilter !== "ALL") {
        filtered = filtered.filter((p) => p.paymentMethod === methodFilter);
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.paymentCode.toLowerCase().includes(q) ||
            p.appointmentCode.toLowerCase().includes(q) ||
            p.patientName.toLowerCase().includes(q)
        );
      }
      if (dateFrom) {
        const from = new Date(dateFrom);
        filtered = filtered.filter((p) => p.paidAt && new Date(p.paidAt) >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((p) => p.paidAt && new Date(p.paidAt) <= to);
      }

      setPayments(filtered);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, methodFilter, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // ==================== ACTIONS ====================

  const handleViewReceipt = async (payment: PaymentRow) => {
    try {
      const detail = await receptionistService.getPaymentById(payment.id);
      setReceiptPayment(detail);
      setShowReceipt(true);
    } catch (error) {
      console.error("Failed to get payment detail:", error);
    }
  };

  const handlePrintReceipt = async () => {
    if (!receiptPayment) return;
    try {
      const invoice = await receptionistService.getInvoiceByPayment(receiptPayment.id);
      if (invoice?.id) {
        const blob = await receptionistService.downloadInvoicePDF(invoice.id);
        const url = URL.createObjectURL(blob);
        const w = window.open(url);
        if (w) w.print();
      }
    } catch (error) {
      console.error("Print failed:", error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!receiptPayment) return;
    try {
      const invoice = await receptionistService.getInvoiceByPayment(receiptPayment.id);
      if (invoice?.id) {
        const blob = await receptionistService.downloadInvoicePDF(invoice.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${receiptPayment.paymentCode}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setMethodFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setPage(0);
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              placeholder="Payment code / appointment / patient..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {/* Status */}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          {/* Method */}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Method</label>
            <select
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="MOMO">MoMo</option>
            </select>
          </div>
          {/* Date From */}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          {/* Date To */}
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          {/* Reset */}
          <div className="flex items-end">
            <button onClick={handleResetFilters} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {payments.length} of {totalElements} transactions
        </p>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Payment Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Paid At</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Collected By</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-brand-500 text-xs">{p.paymentCode}</span>
                      {p.appointmentCode && (
                        <span className="block text-xs text-gray-400 mt-0.5">{p.appointmentCode}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{p.patientName || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{formatCurrency(p.totalAmount)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.paymentStatus] || STATUS_STYLES.PENDING}`}>
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{formatDate(p.paidAt)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">{p.processedByName || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleViewReceipt(p)}
                        className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
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

      {/* ==================== RECEIPT MODAL ==================== */}
      <Modal isOpen={showReceipt} onClose={() => setShowReceipt(false)} className="max-w-lg p-6 sm:p-8 mx-4">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Receipt</h2>
          {receiptPayment && (
            <>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Payment Code</span>
                  <span className="font-mono text-gray-900 dark:text-white font-medium">{receiptPayment.paymentCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Appointment</span>
                  <span className="text-gray-900 dark:text-white">{receiptPayment.appointmentCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Patient</span>
                  <span className="text-gray-900 dark:text-white">{receiptPayment.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Doctor</span>
                  <span className="text-gray-900 dark:text-white">{receiptPayment.doctorName}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(receiptPayment.amount)}</span>
                  </div>
                  {receiptPayment.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Discount</span>
                      <span className="text-green-600">-{formatCurrency(receiptPayment.discountAmount)}</span>
                    </div>
                  )}
                  {receiptPayment.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Tax</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(receiptPayment.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-brand-500 text-lg">{formatCurrency(receiptPayment.totalAmount)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[receiptPayment.paymentStatus] || ""}`}>
                      {receiptPayment.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Method</span>
                    <span className="text-gray-900 dark:text-white">{METHOD_LABELS[receiptPayment.paymentMethod] || receiptPayment.paymentMethod}</span>
                  </div>
                  {receiptPayment.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
                      <span className="font-mono text-xs text-gray-900 dark:text-white">{receiptPayment.transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Paid At</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(receiptPayment.paidAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Collected By</span>
                    <span className="text-gray-900 dark:text-white">{receiptPayment.processedByName || "—"}</span>
                  </div>
                  {receiptPayment.amountReceived > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Amount Received</span>
                        <span className="text-gray-900 dark:text-white">{formatCurrency(receiptPayment.amountReceived)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Change Given</span>
                        <span className="text-gray-900 dark:text-white">{formatCurrency(receiptPayment.changeGiven)}</span>
                      </div>
                    </>
                  )}
                  {receiptPayment.notes && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Notes</span>
                      <span className="text-gray-900 dark:text-white">{receiptPayment.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handlePrintReceipt} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-sm font-medium">
                  Print
                </button>
                <button onClick={handleDownloadPDF} className="flex-1 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 text-sm font-medium">
                  Download PDF
                </button>
                <button onClick={() => setShowReceipt(false)} className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium">
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
