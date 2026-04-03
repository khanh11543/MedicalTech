import { useState, useEffect, useCallback } from "react";
import type { ReceptionistAppointmentListDTO } from "../../../services/receptionistService";
import serviceOrderService from "../../../services/serviceOrderService";
import type { ServiceOrderDTO } from "../../../services/serviceOrderService";
import { SERVICE_CATEGORY_LABELS } from "../../../services/serviceOrderService";

// ═══════════════════════ TYPES ═══════════════════════
interface CollectServiceOrderPaymentModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

type PaymentMethod = "CASH" | "MOMO";

const formatCurrency = (amount: number | undefined | null) => {
  if (!amount) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const PAYMENT_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  UNPAID: { label: "Unpaid", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  PAID: { label: "Paid", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
};

// ═══════════════════════════════════════════════════════
//  CollectServiceOrderPaymentModal
// ═══════════════════════════════════════════════════════
export function CollectServiceOrderPaymentModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
  onError,
  onRefresh,
}: CollectServiceOrderPaymentModalProps) {
  const [step, setStep] = useState<"list" | "confirm" | "success">("list");
  const [orders, setOrders] = useState<ServiceOrderDTO[]>([]);
  const [allOrders, setAllOrders] = useState<ServiceOrderDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  // Fetch service orders
  const fetchOrders = useCallback(async () => {
    if (!appointment) return;
    try {
      setFetchLoading(true);
      const [pending, all] = await Promise.all([
        serviceOrderService.getPendingPaymentOrders(appointment.id),
        serviceOrderService.getServiceOrdersForReceptionist(appointment.id),
      ]);
      setOrders(pending);
      setAllOrders(all);
      // Auto-select all pending orders
      setSelectedIds(new Set(pending.map((o) => o.id)));
    } catch {
      onError("Failed to load service orders");
    } finally {
      setFetchLoading(false);
    }
  }, [appointment, onError]);

  useEffect(() => {
    if (isOpen && appointment) {
      setStep("list");
      setPaymentMethod("CASH");
      setSelectedIds(new Set());
      fetchOrders();
    }
  }, [isOpen, appointment, fetchOrders]);

  // Toggle selection
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const selectedOrders = orders.filter((o) => selectedIds.has(o.id));
  const totalAmount = selectedOrders.reduce((sum, o) => sum + (o.price || 0), 0);

  // Handle payment
  const handleCollectPayment = async () => {
    if (selectedIds.size === 0) return;
    try {
      setLoading(true);
      const ids = Array.from(selectedIds);
      await serviceOrderService.collectPaymentBatch(ids, paymentMethod);
      setStep("success");
    } catch {
      onError("Failed to collect payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    onSuccess(`Payment collected for ${selectedIds.size} service order(s)!`);
    onRefresh();
    onClose();
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step !== "success" ? onClose : undefined} />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Service Order Payment</h3>
                <p className="text-teal-100 text-xs">{appointment.patientName} &bull; {appointment.appointmentCode || `#${appointment.id}`}</p>
              </div>
            </div>
            {step !== "success" && (
              <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Fetch loading */}
        {fetchLoading && (
          <div className="px-6 py-12 text-center">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading service orders...</p>
          </div>
        )}

        {/* Step: List / Select */}
        {!fetchLoading && step === "list" && (
          <div className="flex flex-col overflow-hidden">
            {/* All orders overview */}
            {allOrders.length > 0 && (
              <div className="px-6 pt-4 pb-2 shrink-0">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  All Service Orders ({allOrders.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                        <th className="pb-2 font-medium">Service</th>
                        <th className="pb-2 font-medium">Category</th>
                        <th className="pb-2 font-medium text-right">Price</th>
                        <th className="pb-2 font-medium text-center">Status</th>
                        <th className="pb-2 font-medium text-center">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {allOrders.map((o) => {
                        const ps = PAYMENT_STATUS_BADGE[o.paymentStatus || "UNPAID"] || PAYMENT_STATUS_BADGE.UNPAID;
                        return (
                          <tr key={o.id} className="text-gray-700 dark:text-gray-300">
                            <td className="py-1.5 font-medium">{o.serviceName}</td>
                            <td className="py-1.5">{SERVICE_CATEGORY_LABELS[o.category] || o.category}</td>
                            <td className="py-1.5 text-right">{formatCurrency(o.price)}</td>
                            <td className="py-1.5 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {o.status}
                              </span>
                            </td>
                            <td className="py-1.5 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${ps.cls}`}>
                                {ps.label}
                                {o.paymentMethod ? ` (${o.paymentMethod})` : ""}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pending payment section */}
            {orders.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">All service orders have been paid</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No pending payments for this appointment</p>
                <button onClick={onClose} className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600">
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="px-6 pt-3 pb-2 shrink-0 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      Pending Payment ({orders.length})
                    </h4>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === orders.length}
                        onChange={toggleAll}
                        className="rounded text-teal-500 focus:ring-teal-500"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Select all</span>
                    </label>
                  </div>
                </div>

                <div className="px-6 overflow-y-auto flex-1 max-h-48">
                  <div className="space-y-2 pb-2">
                    {orders.map((o) => (
                      <label
                        key={o.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedIds.has(o.id)
                            ? "border-teal-400 dark:border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(o.id)}
                          onChange={() => toggleSelect(o.id)}
                          className="mt-0.5 rounded text-teal-500 focus:ring-teal-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{o.serviceName}</span>
                            <span className="text-sm font-bold text-teal-600 dark:text-teal-400 ml-2 whitespace-nowrap">
                              {formatCurrency(o.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {SERVICE_CATEGORY_LABELS[o.category] || o.category}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">&bull;</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Dr. {o.orderedByDoctorName}
                            </span>
                            {o.priority === "URGENT" && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded">
                                URGENT
                              </span>
                            )}
                            {o.priority === "STAT" && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded">
                                STAT
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Payment method + confirm */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0 space-y-3">
                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total ({selectedIds.size} service{selectedIds.size !== 1 ? "s" : ""})
                    </span>
                    <span className="text-xl font-bold text-teal-600 dark:text-teal-400">{formatCurrency(totalAmount)}</span>
                  </div>

                  {/* Payment method */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Payment Method</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod("CASH")}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                          paymentMethod === "CASH"
                            ? "border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-900/20"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          paymentMethod === "CASH" ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-700"
                        }`}>
                          <svg className={`w-4 h-4 ${paymentMethod === "CASH" ? "text-green-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${paymentMethod === "CASH" ? "text-green-700 dark:text-green-300" : "text-gray-600 dark:text-gray-400"}`}>Cash</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("MOMO")}
                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                          paymentMethod === "MOMO"
                            ? "border-pink-400 bg-pink-50 dark:border-pink-500 dark:bg-pink-900/20"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          paymentMethod === "MOMO" ? "bg-pink-100 dark:bg-pink-900/30" : "bg-gray-100 dark:bg-gray-700"
                        }`}>
                          <svg className={`w-4 h-4 ${paymentMethod === "MOMO" ? "text-pink-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-bold ${paymentMethod === "MOMO" ? "text-pink-700 dark:text-pink-300" : "text-gray-600 dark:text-gray-400"}`}>MoMo</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Confirm button */}
                  <button
                    onClick={handleCollectPayment}
                    disabled={loading || selectedIds.size === 0}
                    className="w-full py-3 text-sm font-bold text-white bg-teal-500 rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-teal-500/25"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      `Collect Payment — ${formatCurrency(totalAmount)}`
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">Payment Collected!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedIds.size} service order{selectedIds.size !== 1 ? "s" : ""} paid via {paymentMethod}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(totalAmount)}</p>
            <button
              onClick={handleSuccessClose}
              className="mt-6 px-6 py-2.5 text-sm font-bold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
