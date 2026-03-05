import { useState, useEffect, useRef, useCallback } from "react";
import receptionistService from "../../../services/receptionistService";
import type {
  ReceptionistAppointmentListDTO,
  PaymentFullDTO,
  MarkCashPaymentDTO,
  CreateFollowUpRequest,
} from "../../../services/receptionistService";

// ═══════════════════════════════ TYPES ═══════════════════════════════
interface CollectPaymentModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  onRefresh: () => void;
}

interface ReceiptActionsModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onError: (msg: string) => void;
}

interface CreateFollowUpModalProps {
  isOpen: boolean;
  appointment: ReceptionistAppointmentListDTO | null;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

type PaymentMethod = "CASH" | "MOMO";

interface QRData {
  qrCodeUrl: string;
  orderId: string;
  expiresAt: string;
  payUrl: string;
}

const formatCurrency = (amount: number | undefined | null) => {
  if (!amount) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

// ═══════════════════════════════════════════════════════════════════════
//  1) CollectPaymentModal — full Cash/MoMo collection from appointment
// ═══════════════════════════════════════════════════════════════════════
export function CollectPaymentModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
  onError,
  onRefresh,
}: CollectPaymentModalProps) {

  // Steps: method → cash-form | momo-qr → success
  const [step, setStep] = useState<"method" | "cash" | "momo" | "success">("method");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentDetail, setPaymentDetail] = useState<PaymentFullDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  // Cash
  const [amountReceived, setAmountReceived] = useState("");
  const [cashNotes, setCashNotes] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);

  // MoMo
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [momoStatus, setMomoStatus] = useState<"idle" | "waiting" | "success" | "failed" | "expired">("idle");
  const [qrCountdown, setQrCountdown] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval>>(null);

  // Initialize payment on open
  useEffect(() => {
    if (!isOpen || !appointment) {
      // Reset
      setStep("method");
      setPaymentMethod("CASH");
      setPaymentDetail(null);
      setAmountReceived("");
      setCashNotes("");
      setQrData(null);
      setMomoStatus("idle");
      setQrCountdown(0);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    const init = async () => {
      try {
        setInitLoading(true);
        // Try create payment (backend returns existing if already created)
        const created = await receptionistService.createPayment({
          appointmentId: appointment.id,
          paymentMethod: "CASH",
        });
        setPaymentDetail(created);
      } catch (err: unknown) {
        // If 409: already paid
        const error = err as { response?: { status?: number } };
        if (error?.response?.status === 409) {
          onError("Payment already completed for this appointment");
          onClose();
          return;
        }
        // Fallback: try to find existing payment
        try {
          const payments = await receptionistService.getPayments(0, 50);
          const match = (payments?.content || []).find(
            (p: { appointmentId?: number }) => p.appointmentId === appointment.id
          );
          if (match) {
            const detail = await receptionistService.getPaymentById(match.id);
            setPaymentDetail(detail);
          } else {
            onError("Could not initialize payment");
            onClose();
          }
        } catch {
          onError("Could not initialize payment");
          onClose();
        }
      } finally {
        setInitLoading(false);
      }
    };
    init();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isOpen, appointment, onClose, onError]);

  // ── Cash payment ──
  const handleCashPayment = async () => {
    if (!paymentDetail) return;
    try {
      setLoading(true);
      const dto: MarkCashPaymentDTO = {
        notes: cashNotes || undefined,
        amountReceived: amountReceived ? parseFloat(amountReceived) : undefined,
        changeGiven: amountReceived ? Math.max(0, parseFloat(amountReceived) - (paymentDetail.totalAmount || paymentDetail.amount)) : undefined,
        printReceipt,
      };
      await receptionistService.markPaymentCashV2(paymentDetail.id, dto);
      setStep("success");
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error?.response?.status === 409) {
        onError("Payment already collected");
        onClose();
      } else {
        onError("Cash payment failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── MoMo init ──
  const handleMomoInit = async () => {
    if (!paymentDetail) return;
    try {
      setLoading(true);
      setMomoStatus("waiting");
      const result = await receptionistService.initMomoPayment(paymentDetail.id);
      setQrData({
        qrCodeUrl: result.qrCodeUrl || result.qrCode,
        orderId: result.orderId,
        expiresAt: result.expiresAt || "",
        payUrl: result.payUrl || "",
      });
      // Start countdown (5 min)
      setQrCountdown(300);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setQrCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setMomoStatus("expired");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start polling for payment status
      startPolling();
    } catch {
      onError("Failed to initialize MoMo payment");
      setMomoStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      if (!paymentDetail) return;
      try {
        const pd = await receptionistService.getPaymentById(paymentDetail.id);
        if (pd.paymentStatus === "COMPLETED" || pd.paymentStatus === "PAID") {
          setMomoStatus("success");
          setPaymentDetail(pd);
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
          setTimeout(() => setStep("success"), 1500);
        } else if (pd.paymentStatus === "FAILED") {
          setMomoStatus("failed");
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      } catch { /* continue polling */ }
    }, 3000);
  }, [paymentDetail]);

  const handleRefreshQR = async () => {
    if (!paymentDetail) return;
    try {
      setLoading(true);
      const result = await receptionistService.refreshPaymentQR(paymentDetail.id);
      setQrData({
        qrCodeUrl: result.qrCodeUrl || result.qrCode,
        orderId: result.orderId,
        expiresAt: result.expiresAt || "",
        payUrl: result.payUrl || "",
      });
      setQrCountdown(300);
      setMomoStatus("waiting");
      startPolling();
    } catch {
      onError("Failed to refresh QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    onSuccess("Payment collected successfully!");
    onRefresh();
    onClose();
  };

  if (!isOpen || !appointment) return null;

  const totalAmount = paymentDetail?.totalAmount || paymentDetail?.amount || appointment.fee || 0;
  const change = amountReceived ? Math.max(0, parseFloat(amountReceived) - totalAmount) : 0;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step !== "success" ? onClose : undefined} />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Collect Payment</h3>
                <p className="text-emerald-100 text-xs">{appointment.appointmentCode}</p>
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

        {/* Init loading */}
        {initLoading && (
          <div className="px-6 py-12 text-center">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Initializing payment...</p>
          </div>
        )}

        {/* Step: Method Selection */}
        {!initLoading && step === "method" && (
          <div className="px-6 py-5 space-y-4">
            {/* Patient summary */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{appointment.patientName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{appointment.doctorName} • {appointment.doctorSpecialization}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalAmount)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Amount due</p>
                </div>
              </div>
            </div>

            {/* Payment method cards */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose payment method</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setPaymentMethod("CASH"); setStep("cash"); }}
                  className="p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:border-green-400 dark:hover:border-green-600 transition-all group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">Cash</p>
                    <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">Instant processing</p>
                  </div>
                </button>

                <button
                  onClick={() => { setPaymentMethod("MOMO"); setStep("momo"); handleMomoInit(); }}
                  className="p-4 rounded-xl border-2 border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/20 hover:border-pink-400 dark:hover:border-pink-600 transition-all group"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-pink-700 dark:text-pink-300">MoMo</p>
                    <p className="text-xs text-pink-600/70 dark:text-pink-400/70 mt-0.5">QR code scan</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Cash Form */}
        {!initLoading && step === "cash" && (
          <div className="px-6 py-5 space-y-4">
            <button onClick={() => setStep("method")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase">Amount Due</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{formatCurrency(totalAmount)}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Received</label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  placeholder={totalAmount.toLocaleString()}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {amountReceived && parseFloat(amountReceived) > 0 && (
                <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <span className="text-sm text-amber-700 dark:text-amber-300">Change</span>
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatCurrency(change)}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                <textarea
                  value={cashNotes}
                  onChange={e => setCashNotes(e.target.value)}
                  rows={2}
                  maxLength={200}
                  placeholder="Payment notes..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={printReceipt} onChange={e => setPrintReceipt(e.target.checked)} className="rounded text-emerald-500 focus:ring-emerald-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Print receipt after payment</span>
              </label>
            </div>

            <button
              onClick={handleCashPayment}
              disabled={loading}
              className="w-full py-3 text-sm font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                `Confirm Cash Payment — ${formatCurrency(totalAmount)}`
              )}
            </button>
          </div>
        )}

        {/* Step: MoMo QR */}
        {!initLoading && step === "momo" && (
          <div className="px-6 py-5 space-y-4">
            <button onClick={() => { setStep("method"); setMomoStatus("idle"); if (pollingRef.current) clearInterval(pollingRef.current); if (countdownRef.current) clearInterval(countdownRef.current); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="text-center">
              <p className="text-xs text-pink-600 dark:text-pink-400 font-medium uppercase">Scan to Pay</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalAmount)}</p>
            </div>

            {/* QR waiting */}
            {momoStatus === "waiting" && qrData && (
              <div className="space-y-3">
                <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 flex justify-center">
                  <img src={qrData.qrCodeUrl} alt="MoMo QR" className="w-48 h-48 object-contain" />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Expires in</span>
                  <span className={`font-mono font-bold ${qrCountdown < 60 ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>
                    {Math.floor(qrCountdown / 60)}:{String(qrCountdown % 60).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Waiting for payment...</span>
                </div>
              </div>
            )}

            {/* MoMo loading */}
            {(momoStatus === "idle" || (momoStatus === "waiting" && !qrData)) && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Generating QR code...</p>
              </div>
            )}

            {/* MoMo success */}
            {momoStatus === "success" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-green-600">Payment Received!</p>
              </div>
            )}

            {/* MoMo expired */}
            {momoStatus === "expired" && (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-orange-600">QR Code Expired</p>
                <div className="flex justify-center gap-2">
                  <button onClick={handleRefreshQR} disabled={loading} className="px-4 py-2 text-xs font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:opacity-50">
                    {loading ? "Refreshing..." : "New QR Code"}
                  </button>
                  <button onClick={() => { setStep("cash"); setMomoStatus("idle"); if (pollingRef.current) clearInterval(pollingRef.current); }} className="px-4 py-2 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600">
                    Switch to Cash
                  </button>
                </div>
              </div>
            )}

            {/* MoMo failed */}
            {momoStatus === "failed" && (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-red-600">Payment Failed</p>
                <div className="flex justify-center gap-2">
                  <button onClick={handleRefreshQR} disabled={loading} className="px-4 py-2 text-xs font-semibold text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:opacity-50">
                    Retry MoMo
                  </button>
                  <button onClick={() => { setStep("cash"); setMomoStatus("idle"); }} className="px-4 py-2 text-xs font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600">
                    Switch to Cash
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="px-6 py-8 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">Payment Collected!</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatCurrency(totalAmount)} received via {paymentMethod === "CASH" ? "Cash" : "MoMo"}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-left">
                  <p className="text-gray-500 dark:text-gray-400">Patient</p>
                  <p className="font-medium text-gray-900 dark:text-white">{appointment.patientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 dark:text-gray-400">Code</p>
                  <p className="font-mono font-medium text-gray-900 dark:text-white">{appointment.appointmentCode}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleSuccessClose}
              className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  2) ReceiptActionsModal — Download PDF / Email receipt
// ═══════════════════════════════════════════════════════════════════════
export function ReceiptActionsModal({
  isOpen,
  appointment,
  onClose,
  onError,
}: ReceiptActionsModalProps) {

  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{ paymentId: number; paymentCode: string; paidAt: string; amount: number; method: string } | null>(null);

  // Find invoice from appointment's payment
  useEffect(() => {
    if (!isOpen || !appointment) {
      setInvoiceId(null);
      setPaymentInfo(null);
      setEmailSent(false);
      return;
    }

    const findInvoice = async () => {
      try {
        setLoadingInvoice(true);
        // Get appointment detail to get paymentId
        const detail = await receptionistService.getAppointmentDetail(appointment.id);
        if (!detail.payment) {
          onError("No payment found for this appointment");
          onClose();
          return;
        }
        const pid = detail.payment.paymentId;
        setPaymentInfo({
          paymentId: pid,
          paymentCode: "",
          paidAt: detail.payment.paidAt || "",
          amount: detail.payment.fee,
          method: detail.payment.paymentMethod || "CASH",
        });

        // Get invoice
        try {
          const invoice = await receptionistService.getInvoiceByPayment(pid);
          setInvoiceId(invoice?.id || null);
        } catch {
          // Invoice may not exist yet - that's OK, will try to download directly
          setInvoiceId(null);
        }
      } catch {
        onError("Failed to load payment details");
        onClose();
      } finally {
        setLoadingInvoice(false);
      }
    };
    findInvoice();
  }, [isOpen, appointment, onClose, onError]);

  const handleDownloadPDF = async () => {
    if (!invoiceId && !paymentInfo) return;
    try {
      setDownloading(true);
      if (invoiceId) {
        const blob = await receptionistService.downloadInvoicePDF(invoiceId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${appointment?.appointmentCode || "unknown"}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      onError("Failed to download receipt PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleEmailReceipt = async () => {
    if (!paymentInfo) return;
    try {
      setEmailing(true);
      await receptionistService.sendInvoice(paymentInfo.paymentId, {
        sendEmail: true,
      });
      setEmailSent(true);
    } catch {
      onError("Failed to email receipt");
    } finally {
      setEmailing(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Receipt</h3>
                <p className="text-sky-100 text-xs">{appointment.appointmentCode}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loadingInvoice ? (
          <div className="px-6 py-10 text-center">
            <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading receipt info...</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* Payment summary */}
            {paymentInfo && (
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Patient</span>
                  <span className="font-medium text-gray-900 dark:text-white">{appointment.patientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(paymentInfo.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Method</span>
                  <span className="font-medium text-gray-900 dark:text-white">{paymentInfo.method}</span>
                </div>
                {paymentInfo.paidAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Paid at</span>
                    <span className="text-gray-700 dark:text-gray-300">{new Date(paymentInfo.paidAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading || !invoiceId}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {downloading ? "Downloading..." : "Download PDF"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Save receipt to your device</p>
                </div>
                {downloading && <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />}
              </button>

              <button
                onClick={handleEmailReceipt}
                disabled={emailing || emailSent || !paymentInfo}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${emailSent ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                  {emailSent ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {emailSent ? "Email Sent ✓" : emailing ? "Sending..." : "Email to Patient"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {emailSent ? "Receipt has been sent" : "Send receipt via email"}
                  </p>
                </div>
                {emailing && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
              </button>
            </div>

            {!invoiceId && !loadingInvoice && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 border border-amber-100 dark:border-amber-800/30">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-xs text-amber-600 dark:text-amber-400">Invoice PDF is not yet available. The system will generate it shortly.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={onClose} className="w-full py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  3) CreateFollowUpModal — Book follow-up with patient pre-filled
// ═══════════════════════════════════════════════════════════════════════
export function CreateFollowUpModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
  onError,
}: CreateFollowUpModalProps) {

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("08:30");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");

  // Reset on open
  useEffect(() => {
    if (!isOpen) {
      setDate("");
      setStartTime("08:00");
      setEndTime("08:30");
      setAdminNote("");
      setCreatedCode("");
      setStep("form");
    } else {
      // Default date: 7 days from now
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDate(d.toISOString().split("T")[0]);
    }
  }, [isOpen]);

  // Auto-adjust end time when start time changes
  useEffect(() => {
    if (startTime) {
      const [h, m] = startTime.split(":").map(Number);
      const endMin = h * 60 + m + 30;
      const eh = Math.floor(endMin / 60);
      const em = endMin % 60;
      if (eh < 24) {
        setEndTime(`${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`);
      }
    }
  }, [startTime]);

  const handleCreate = async () => {
    if (!appointment || !date || !startTime || !endTime) return;

    try {
      setLoading(true);
      const dto: CreateFollowUpRequest = {
        appointmentDate: date,
        startTime: startTime + ":00",
        endTime: endTime + ":00",
        type: "FOLLOW_UP",
        adminNote: adminNote.trim() || undefined,
      };
      const result = await receptionistService.createFollowUp(appointment.id, dto);
      setCreatedCode(result.appointmentCode || "");
      setStep("success");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const msg = error?.response?.data?.message || "Failed to create follow-up appointment";
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={step !== "success" ? onClose : undefined} />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Create Follow-up</h3>
                <p className="text-brand-100 text-xs">From {appointment.appointmentCode}</p>
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

        {/* Form */}
        {step === "form" && (
          <div className="px-6 py-5 space-y-4">
            {/* Fixed patient info */}
            <div className="bg-brand-50 dark:bg-brand-900/10 rounded-lg p-3 border border-brand-100 dark:border-brand-800/30">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-medium text-brand-600 dark:text-brand-400 uppercase">Patient (locked)</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{appointment.patientName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{appointment.maskedPhone}</p>
            </div>

            {/* Doctor info */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Same Doctor</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{appointment.doctorName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{appointment.doctorSpecialization}</p>
            </div>

            {/* Date picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Follow-up Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                min={minDateStr}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Time pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  min="06:00"
                  max="20:00"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  min={startTime}
                  max="21:00"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Type badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Follow-up
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Reason category auto-set</span>
            </div>

            {/* Admin note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Administrative Note <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="e.g. Doctor recommended 1-week follow-up for blood test results"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{adminNote.length}/300</p>
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 border border-amber-100 dark:border-amber-800/30">
              <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Do not enter diagnosis or medical details. Use only administrative notes.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !date || !startTime || !endTime}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-brand-500 rounded-xl hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-lg shadow-brand-500/25"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Follow-up"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="px-6 py-8 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">Follow-up Created!</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Appointment <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{createdCode}</span> has been scheduled.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-left">
                  <p className="text-gray-500 dark:text-gray-400">Patient</p>
                  <p className="font-medium text-gray-900 dark:text-white">{appointment.patientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{date}</p>
                </div>
                <div className="text-left">
                  <p className="text-gray-500 dark:text-gray-400">Time</p>
                  <p className="font-medium text-gray-900 dark:text-white">{startTime} – {endTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 dark:text-gray-400">Doctor</p>
                  <p className="font-medium text-gray-900 dark:text-white">{appointment.doctorName}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => { onSuccess(`Follow-up ${createdCode} created successfully`); onClose(); }}
              className="w-full py-2.5 text-sm font-semibold text-white bg-brand-500 rounded-xl hover:bg-brand-600 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
