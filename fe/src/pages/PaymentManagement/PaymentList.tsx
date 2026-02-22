import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import adminService, { Payment, PaymentListParams, Page } from "../../services/adminService";

export default function PaymentList() {
  const [payments, setPayments] = useState<Page<Payment> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<PaymentListParams>({
    pageNumber: 0,
    pageSize: 10,
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    INITIATED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    PROCESSING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    REFUNDED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  };

  const methodLabels: Record<string, string> = {
    CASH: "Cash",
    MOMO: "MoMo",
    BANK_TRANSFER: "Bank Transfer",
    CREDIT_CARD: "Credit Card",
  };

  const fetchPayments = async (params: PaymentListParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPayments(params);
      setPayments(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load payments";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof PaymentListParams, value: string | number | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      pageNumber: 0,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, pageNumber: newPage }));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  const formatCurrency = (amount: number, currency: string = "VND") => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <>
      <PageMeta
        title="Payment Management | MediTech Admin"
        description="Manage payments and invoices in the MediTech system"
      />
      <PageBreadcrumb pageTitle="Payment Management" />

      <div className="rounded-lg border border-gray-200 dark:border-white/[0.05] bg-white dark:bg-white/[0.03] px-6 pt-6 pb-2.5 shadow-sm">
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value || undefined)}
              title="Filter by payment status"
              className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="INITIATED">Initiated</option>
              <option value="PROCESSING">Processing</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Method
            </label>
            <select
              value={filters.method || ""}
              onChange={(e) => handleFilterChange("method", e.target.value || undefined)}
              title="Filter by payment method"
              className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="MOMO">MoMo</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT_CARD">Credit Card</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              From Date
            </label>
            <input
              type="date"
              value={filters.from || ""}
              onChange={(e) => handleFilterChange("from", e.target.value || undefined)}
              title="Select start date"
              className="w-full rounded border border-gray-300 dark:border-white/[0.1] bg-white dark:bg-gray-900 px-4 py-2.5 text-gray-900 dark:text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus-visible:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ pageNumber: 0, pageSize: 10 })}
              className="w-full rounded bg-teal-500 px-4 py-2.5 font-medium text-white hover:bg-teal-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-teal-500 border-t-transparent"></div>
          </div>
        )}

        {/* Table */}
        {!loading && payments && (
          <>
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left border-b border-gray-200 dark:border-white/[0.05]">
                    <th className="min-w-[120px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Payment Code
                    </th>
                    <th className="min-w-[150px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Patient
                    </th>
                    <th className="min-w-[120px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Amount
                    </th>
                    <th className="min-w-[120px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Method
                    </th>
                    <th className="min-w-[120px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="min-w-[150px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Paid At
                    </th>
                    <th className="min-w-[150px] px-4 py-4 font-medium text-gray-700 dark:text-gray-300">
                      Transaction ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.content.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-5 text-center text-gray-500 dark:text-gray-400">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    payments.content.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-200 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <td className="px-4 py-5">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.paymentCode}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {payment.appointmentCode}
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {payment.patientName}
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(payment.totalAmount, payment.currency)}
                          </p>
                          {payment.discountAmount > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Original: {formatCurrency(payment.amount, payment.currency)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-5">
                          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-800 dark:text-gray-300">
                            {methodLabels[payment.paymentMethod] || payment.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              statusColors[payment.paymentStatus] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {payment.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate(payment.paidAt)}
                          </p>
                        </td>
                        <td className="px-4 py-5">
                          <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                            {payment.transactionId || "-"}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {payments.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/[0.05] px-4 py-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {payments.numberOfElements} of {payments.totalElements} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(payments.number - 1)}
                    disabled={payments.first}
                    className="rounded bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-4 text-sm text-gray-700 dark:text-gray-300">
                    Page {payments.number + 1} of {payments.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(payments.number + 1)}
                    disabled={payments.last}
                    className="rounded bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

