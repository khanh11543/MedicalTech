import { useState, useCallback, useEffect, useRef } from "react";
import receptionistService from "../../../services/receptionistService";
import type { PaymentFullDTO, MarkCashPaymentDTO } from "../../../services/receptionistService";
import { Modal } from "../../../components/ui/modal";

// ==================== TYPES ====================

interface AppointmentSearchResult {
  id: number;
  appointmentCode: string;
  patientName: string;
  maskedPhone: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  fee: number;
  paymentStatus: string;
  paymentId: number | null;
}

type PaymentMethod = "CASH" | "MOMO";

interface QRData {
  qrCodeUrl: string;
  orderId: string;
  expiresAt: string;
  payUrl: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CHECKED_IN: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  IN_PROGRESS: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  NO_SHOW: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  INITIATED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const formatCurrency = (amount: number | undefined | null) => {
  if (!amount) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

export default function CollectPayment() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AppointmentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem("recent_payment_searches");
    return saved ? JSON.parse(saved) : [];
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Collect modal state
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentSearchResult | null>(null);
  const [paymentDetail, setPaymentDetail] = useState<PaymentFullDTO | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  // Cash form state
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [cashNotes, setCashNotes] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [emailReceipt, setEmailReceipt] = useState(true);
  const [smsReceipt, setSmsReceipt] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // MoMo QR state
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [momoLoading, setMomoLoading] = useState(false);
  const [momoStatus, setMomoStatus] = useState<"idle" | "waiting" | "success" | "failed" | "expired">("idle");
  const [qrCountdown, setQrCountdown] = useState(0);
  const [refreshingPayment, setRefreshingPayment] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(null);

  // Success screen state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPayment, setSuccessPayment] = useState<PaymentFullDTO | null>(null);

  // Receipt view state
  const [showReceiptView, setShowReceiptView] = useState(false);

  // ==================== SEARCH ====================

  const handleSearch = useCallback(async (query: string, pageNum: number = 0) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setTotalPages(0);
      setTotalElements(0);
      return;
    }
    try {
      setSearching(true);
      // Phone search requires at least 4 chars
      const isPhoneSearch = /^\d+$/.test(query.trim());
      if (isPhoneSearch && query.trim().length < 4) {
        setSearchResults([]);
        setTotalPages(0);
        setTotalElements(0);
        return;
      }
      const data = await receptionistService.getAppointments({
        search: query.trim(),
        pageNumber: pageNum,
        pageSize,
        sortBy: "appointmentDate",
        sortDir: "DESC",
      });
      const results: AppointmentSearchResult[] = (data?.content || []).map((a) => ({
        id: a.id,
        appointmentCode: a.appointmentCode,
        patientName: a.patientName,
        maskedPhone: a.maskedPhone,
        doctorName: a.doctorName,
        doctorSpecialization: a.doctorSpecialization || "",
        appointmentDate: a.appointmentDate,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        fee: a.fee || 0,
        paymentStatus: a.paymentStatus || "PENDING",
        paymentId: a.paymentId || null,
      }));
      setSearchResults(results);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
      setPage(pageNum);

      // Save recent search
      const newRecent = [query.trim(), ...recentSearches.filter((r) => r !== query.trim())].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem("recent_payment_searches", JSON.stringify(newRecent));
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setSearching(false);
    }
  }, [recentSearches]);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(value, 0), 300);
  };

  const handlePageChange = (newPage: number) => {
    handleSearch(searchQuery, newPage);
  };

  // ==================== COLLECT ACTION ====================

  const handleCollectPayment = async (appointment: AppointmentSearchResult) => {
    // Guard: only allow collection for COMPLETED appointments
    if (appointment.status !== "COMPLETED") {
      alert("Payment can only be collected for completed appointments.");
      return;
    }

    // Guard: if already paid, show message instead of opening collect modal
    if (appointment.paymentStatus === "PAID") {
      alert("This appointment has already been paid. Please check Payment History for details.");
      return;
    }

    setSelectedAppointment(appointment);
    setPaymentMethod("CASH");
    setAmountReceived("");
    setCashNotes("");
    setMomoStatus("idle");
    setQrData(null);

    // Try to get or create payment
    try {
      if (appointment.paymentId) {
        const pd = await receptionistService.getPaymentById(appointment.paymentId);
        setPaymentDetail(pd);
      } else {
        // Create payment (backend returns existing if already created)
        const created = await receptionistService.createPayment({ appointmentId: appointment.id, paymentMethod: "CASH" });
        setPaymentDetail(created);
      }
    } catch (error: unknown) {
      console.error("Error getting/creating payment:", error);
      // Fallback: search for existing payment for this appointment
      try {
        // Try multiple statuses since payment could be in any state
        for (const status of ["PENDING", "INITIATED", undefined]) {
          const payments = await receptionistService.getPayments(0, 50, status);
          const match = (payments?.content || []).find(
            (p: { appointmentId?: number }) => p.appointmentId === appointment.id
          );
          if (match) {
            const pd = await receptionistService.getPaymentById(match.id);
            setPaymentDetail(pd);
            break;
          }
        }
      } catch {
        // ignore
      }
    }

    setShowCollectModal(true);
  };

  const handleViewReceipt = async (appointment: AppointmentSearchResult) => {
    setSelectedAppointment(appointment);
    if (appointment.paymentId) {
      try {
        const pd = await receptionistService.getPaymentById(appointment.paymentId);
        setPaymentDetail(pd);
        setShowReceiptView(true);
      } catch (error) {
        console.error("Failed to get payment:", error);
      }
    }
  };

  // ==================== CASH PAYMENT ====================

  const totalAmount = paymentDetail?.totalAmount || selectedAppointment?.fee || 0;
  const receivedNum = parseFloat(amountReceived) || 0;
  const changeGiven = Math.max(0, receivedNum - totalAmount);
  const canCompleteCash = receivedNum >= totalAmount;

  const handleQuickAmount = (amount: number) => {
    if (amount === 0) {
      setAmountReceived(totalAmount.toString());
    } else {
      setAmountReceived(amount.toString());
    }
  };

  const handleCompleteCash = async () => {
    if (!paymentDetail || !canCompleteCash) return;
    setProcessingPayment(true);
    try {
      const dto: MarkCashPaymentDTO = {
        amountReceived: receivedNum,
        changeGiven,
        notes: cashNotes || undefined,
        printReceipt,
        emailReceipt,
        smsReceipt,
      };
      const result = await receptionistService.markPaymentCashV2(paymentDetail.id, dto);
      setSuccessPayment(result);
      setShowCollectModal(false);
      setShowSuccess(true);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Payment failed";
      alert("Payment failed: " + msg);
    } finally {
      setProcessingPayment(false);
    }
  };

  // ==================== MOMO PAYMENT ====================

  const handleInitMomo = async () => {
    if (!paymentDetail) return;
    setMomoLoading(true);
    setMomoStatus("idle");
    try {
      const result = await receptionistService.initMomoPayment(paymentDetail.id);
      setQrData({
        qrCodeUrl: result.qrCodeUrl || result.qrCode,
        orderId: result.orderId,
        expiresAt: result.expiresAt || "",
        payUrl: result.payUrl || "",
      });
      setMomoStatus("waiting");
      setQrCountdown(600); // 10 minutes
      startPolling(paymentDetail.id);
    } catch (error) {
      console.error("MoMo init failed:", error);
      setMomoStatus("failed");
    } finally {
      setMomoLoading(false);
    }
  };

  const handleRefreshQR = async () => {
    if (!paymentDetail) return;
    setMomoLoading(true);
    try {
      const result = await receptionistService.refreshPaymentQR(paymentDetail.id);
      setQrData({
        qrCodeUrl: result.qrCodeUrl || result.qrCode,
        orderId: result.orderId,
        expiresAt: result.expiresAt || "",
        payUrl: result.payUrl || "",
      });
      setQrCountdown(600);
      setMomoStatus("waiting");
      startPolling(paymentDetail.id);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Rate limit exceeded";
      alert("QR refresh failed: " + msg);
    } finally {
      setMomoLoading(false);
    }
  };

  // Refresh payment details from backend (re-fetch amount, status, etc.)
  const handleRefreshPaymentDetails = async () => {
    if (!paymentDetail) return;
    setRefreshingPayment(true);
    try {
      const pd = await receptionistService.getPaymentById(paymentDetail.id);
      setPaymentDetail(pd);
    } catch (error) {
      console.error("Failed to refresh payment details:", error);
    } finally {
      setRefreshingPayment(false);
    }
  };

  const startPolling = (paymentId: number) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const pd = await receptionistService.getPaymentById(paymentId);
        if (pd.paymentStatus === "PAID") {
          setMomoStatus("success");
          setSuccessPayment(pd);
          if (pollingRef.current) clearInterval(pollingRef.current);
          setTimeout(() => {
            setShowCollectModal(false);
            setShowSuccess(true);
          }, 1500);
        } else if (pd.paymentStatus === "FAILED" || pd.paymentStatus === "CANCELLED") {
          setMomoStatus("failed");
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
  };

  const handleSwitchToCash = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setPaymentMethod("CASH");
    setMomoStatus("idle");
    setQrData(null);
  };

  // Regenerate QR directly (used from expired/failed state)
  const handleRegenerateQR = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setQrData(null);
    setMomoStatus("idle");
    // Directly call init to generate new QR without extra click
    await handleInitMomo();
  };

  // QR countdown
  useEffect(() => {
    if (momoStatus !== "waiting" || qrCountdown <= 0) return;
    const timer = setInterval(() => {
      setQrCountdown((c) => {
        if (c <= 1) {
          setMomoStatus("expired");
          if (pollingRef.current) clearInterval(pollingRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [momoStatus, qrCountdown]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ==================== SUCCESS ACTIONS ====================

  const handlePrintReceipt = async () => {
    const payment = successPayment || paymentDetail;
    if (!payment) return;
    try {
      const invoice = await receptionistService.getInvoiceByPayment(payment.id);
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
    const payment = successPayment || paymentDetail;
    if (!payment) return;
    try {
      const invoice = await receptionistService.getInvoiceByPayment(payment.id);
      if (invoice?.id) {
        const blob = await receptionistService.downloadInvoicePDF(invoice.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${payment.paymentCode}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSuccessPayment(null);
    setSelectedAppointment(null);
    setPaymentDetail(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatMinutes = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          Search Appointment
        </h2>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Appointment code / phone / patient name..."
              className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            <svg className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searching && (
              <div className="absolute right-3.5 top-3.5">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            onClick={() => handleSearch(searchQuery)}
            className="px-6 py-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium"
          >
            Search
          </button>
        </div>

        {/* Recent searches */}
        {!searchQuery && recentSearches.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">Recent:</span>
            {recentSearches.map((r, i) => (
              <button
                key={i}
                onClick={() => { setSearchQuery(r); handleSearch(r); }}
                className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalElements)} of {totalElements} result(s)
          </h3>
          {searchResults.map((apt) => (
            <div key={apt.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left: Appointment info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => copyToClipboard(apt.appointmentCode)}
                      className="font-mono text-sm font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1"
                      title="Click to copy"
                    >
                      {apt.appointmentCode}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[apt.status] || STATUS_STYLES.PENDING}`}>
                      {apt.status}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_STYLES[apt.paymentStatus] || PAYMENT_STATUS_STYLES.PENDING}`}>
                      {apt.paymentStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                    <p className="text-gray-900 dark:text-white">
                      <span className="text-gray-500 dark:text-gray-400">Patient: </span>
                      <span className="font-medium">{apt.patientName}</span>
                      {apt.maskedPhone && <span className="text-gray-400 ml-1">({apt.maskedPhone})</span>}
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      <span className="text-gray-500 dark:text-gray-400">Doctor: </span>
                      {apt.doctorName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      <span className="text-gray-500 dark:text-gray-400">Date: </span>
                      {apt.appointmentDate} {apt.startTime}–{apt.endTime}
                    </p>
                    <p className="text-gray-900 dark:text-white font-bold text-lg">
                      {formatCurrency(apt.fee)}
                    </p>
                  </div>
                </div>

                {/* Right: CTA */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const isCompleted = apt.status === "COMPLETED";
                    const isCancelled = apt.status === "CANCELLED" || apt.status === "NO_SHOW";
                    const isPaid = apt.paymentStatus === "PAID";
                    const isPending = apt.paymentStatus === "PENDING";
                    const isFailed = apt.paymentStatus === "FAILED" || apt.paymentStatus === "CANCELLED";
                    const hasAmount = apt.fee > 0;

                    // PAID → View Receipt only
                    if (isPaid) {
                      return (
                        <button
                          onClick={() => handleViewReceipt(apt)}
                          className="px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
                        >
                          View Receipt
                        </button>
                      );
                    }

                    // CANCELLED / NO_SHOW → no payment actions
                    if (isCancelled) {
                      return (
                        <span className="px-3 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          {apt.status === "CANCELLED" ? "Cancelled" : "No Show"} — No charge
                        </span>
                      );
                    }

                    // Not yet COMPLETED → cannot collect
                    if (!isCompleted) {
                      return (
                        <span className="px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          Awaiting completion
                        </span>
                      );
                    }

                    // COMPLETED + 0đ → no charge
                    if (!hasAmount && isPending) {
                      return (
                        <span className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          No charge (0 ₫)
                        </span>
                      );
                    }

                    // COMPLETED + PENDING + amount > 0 → Collect
                    if (isPending && hasAmount) {
                      return (
                        <button
                          onClick={() => handleCollectPayment(apt)}
                          className="px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm font-medium shadow-sm"
                        >
                          Collect Payment
                        </button>
                      );
                    }

                    // COMPLETED + FAILED → Retry
                    if (isFailed) {
                      return (
                        <button
                          onClick={() => handleCollectPayment(apt)}
                          className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium shadow-sm"
                        >
                          Retry Payment
                        </button>
                      );
                    }

                    return null;
                  })()}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => handlePageChange(Math.max(0, page - 1))}
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
                    onClick={() => handlePageChange(pNum)}
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
                onClick={() => handlePageChange(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state when search has no results */}
      {searchQuery && !searching && searchResults.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-16 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No appointments found for "{searchQuery}"</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try appointment code, phone number (min 4 digits), or patient name</p>
        </div>
      )}

      {/* ==================== COLLECT PAYMENT MODAL ==================== */}
      <Modal isOpen={showCollectModal} onClose={() => { setShowCollectModal(false); if (pollingRef.current) clearInterval(pollingRef.current); }} className="max-w-2xl p-6 sm:p-8 mx-4">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg> Collect Payment</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-mono">{selectedAppointment?.appointmentCode}</span>
              <span>•</span>
              <span>{selectedAppointment?.patientName}</span>
            </div>
          </div>

          {/* Invoice Summary */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Invoice Summary</h3>
              <button
                onClick={handleRefreshPaymentDetails}
                disabled={refreshingPayment}
                className="flex items-center gap-1 px-2 py-1 text-xs text-brand-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh payment details"
              >
                {refreshingPayment ? (
                  <div className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                Refresh
              </button>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Consultation fee</span>
              <span className="text-gray-900 dark:text-white">{formatCurrency(paymentDetail?.amount || selectedAppointment?.fee)}</span>
            </div>
            {paymentDetail && paymentDetail.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Discount</span>
                <span className="text-green-600">-{formatCurrency(paymentDetail.discountAmount)}</span>
              </div>
            )}
            {paymentDetail && paymentDetail.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tax</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(paymentDetail.taxAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between">
              <span className="font-bold text-gray-900 dark:text-white">Total Amount Due</span>
              <span className="font-bold text-2xl text-brand-500">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Payment Method Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => { setPaymentMethod("CASH"); if (pollingRef.current) clearInterval(pollingRef.current); setMomoStatus("idle"); }}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                paymentMethod === "CASH"
                  ? "bg-green-500 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <span className="inline-flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg> Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod("MOMO")}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                paymentMethod === "MOMO"
                  ? "bg-pink-500 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <span className="inline-flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> MoMo</span>
            </button>
          </div>

          {/* ===== CASH FORM ===== */}
          {paymentMethod === "CASH" && (
            <div className="space-y-4">
              {/* Amount received */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount Received</label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full px-4 py-3 text-lg font-bold rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {/* Quick amounts */}
                <div className="flex gap-2 mt-2">
                  {[
                    { label: "Exact", value: 0 },
                    { label: "500K", value: 500000 },
                    { label: "1M", value: 1000000 },
                    { label: "2M", value: 2000000 },
                  ].map((q) => (
                    <button
                      key={q.label}
                      onClick={() => handleQuickAmount(q.value)}
                      className="flex-1 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change */}
              {receivedNum > 0 && (
                <div className={`p-4 rounded-xl ${canCompleteCash ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Change to return</span>
                    <span className={`text-xl font-bold ${canCompleteCash ? "text-green-600" : "text-red-600"}`}>
                      {canCompleteCash ? formatCurrency(changeGiven) : `Short ${formatCurrency(totalAmount - receivedNum)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={cashNotes}
                  onChange={(e) => setCashNotes(e.target.value)}
                  placeholder="No diagnosis or health info..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Receipt options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Receipt Options</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={printReceipt} onChange={(e) => setPrintReceipt(e.target.checked)} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                    Print receipt
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={emailReceipt} onChange={(e) => setEmailReceipt(e.target.checked)} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                    Email receipt
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input type="checkbox" checked={smsReceipt} onChange={(e) => setSmsReceipt(e.target.checked)} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                    SMS receipt
                  </label>
                </div>
              </div>

              {/* Complete button */}
              <button
                onClick={handleCompleteCash}
                disabled={!canCompleteCash || processingPayment}
                className="w-full py-3.5 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold shadow-sm"
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Complete Payment — ${formatCurrency(totalAmount)}`
                )}
              </button>
            </div>
          )}

          {/* ===== MOMO (QR) ===== */}
          {paymentMethod === "MOMO" && (
            <div className="space-y-4">
              {momoStatus === "idle" && (
                <div className="text-center py-6">
                  <button
                    onClick={handleInitMomo}
                    disabled={momoLoading}
                    className="px-8 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
                  >
                    {momoLoading ? "Generating QR..." : "Generate MoMo QR"}
                  </button>
                </div>
              )}

              {momoStatus === "waiting" && qrData && (
                <div className="text-center space-y-4">
                  {/* QR Code */}
                  <div className="inline-block bg-white p-4 rounded-2xl shadow-lg">
                    <img
                      src={qrData.qrCodeUrl}
                      alt="MoMo QR Code"
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{qrData.orderId}</p>

                  {/* Countdown */}
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Waiting for payment... ({formatMinutes(qrCountdown)})
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-center gap-3 flex-wrap">
                    <button
                      onClick={handleRefreshQR}
                      disabled={momoLoading}
                      className="px-4 py-2 text-sm bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 disabled:opacity-50"
                    >
                      {momoLoading ? "Loading..." : "Refresh QR"}
                    </button>
                    <button
                      onClick={handleSwitchToCash}
                      className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50"
                    >
                      Switch to Cash
                    </button>
                    <button
                      onClick={() => { setShowCollectModal(false); if (pollingRef.current) clearInterval(pollingRef.current); }}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {momoStatus === "success" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-green-600">Payment Received!</p>
                </div>
              )}

              {/* QR Expired - offer direct regenerate */}
              {momoStatus === "expired" && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-orange-600">QR Code Expired</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">The QR code has expired. Click the button below to generate a new one.</p>
                  </div>
                  <div className="flex justify-center gap-3 flex-wrap">
                    <button
                      onClick={handleRegenerateQR}
                      disabled={momoLoading}
                      className="px-6 py-2.5 text-sm bg-pink-500 text-white rounded-xl hover:bg-pink-600 disabled:opacity-50 transition-colors font-medium shadow-sm"
                    >
                      {momoLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating new QR...
                        </span>
                      ) : (
                        "Generate New QR"
                      )}
                    </button>
                    <button
                      onClick={handleSwitchToCash}
                      className="px-6 py-2.5 text-sm bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium shadow-sm"
                    >
                      Switch to Cash
                    </button>
                  </div>
                </div>
              )}

              {momoStatus === "failed" && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">Payment Failed</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">MoMo transaction was unsuccessful. Please try again or switch to cash.</p>
                  </div>
                  <div className="flex justify-center gap-3 flex-wrap">
                    <button
                      onClick={handleRegenerateQR}
                      disabled={momoLoading}
                      className="px-6 py-2.5 text-sm bg-pink-500 text-white rounded-xl hover:bg-pink-600 disabled:opacity-50 transition-colors font-medium shadow-sm"
                    >
                      {momoLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Generating new QR...
                        </span>
                      ) : (
                        "Retry MoMo"
                      )}
                    </button>
                    <button
                      onClick={handleSwitchToCash}
                      className="px-6 py-2.5 text-sm bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium shadow-sm"
                    >
                      Switch to Cash
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* ==================== SUCCESS SCREEN ==================== */}
      <Modal isOpen={showSuccess} onClose={handleCloseSuccess} className="max-w-lg p-6 sm:p-8 mx-4">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Received Successfully</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Transaction completed</p>
          </div>

          {successPayment && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-2 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Transaction Code</span>
                <button onClick={() => copyToClipboard(successPayment.paymentCode)} className="font-mono text-brand-500 hover:underline flex items-center gap-1">
                  {successPayment.paymentCode}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Method</span>
                <span className="text-gray-900 dark:text-white">{successPayment.paymentMethod === "CASH" ? "Cash" : "MoMo"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Amount</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(successPayment.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Time</span>
                <span className="text-gray-900 dark:text-white">{successPayment.paidAt ? new Date(successPayment.paidAt).toLocaleString("en-US") : "Just now"}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handlePrintReceipt} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium">
              Print Receipt
            </button>
            <button onClick={handleDownloadPDF} className="flex-1 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors text-sm font-medium">
              Download PDF
            </button>
            <button onClick={handleCloseSuccess} className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium">
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* ==================== RECEIPT VIEW (Read-only) ==================== */}
      <Modal isOpen={showReceiptView} onClose={() => setShowReceiptView(false)} className="max-w-lg p-6 sm:p-8 mx-4">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Receipt</h2>
          {paymentDetail && (
            <>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Payment Code</span><span className="font-mono text-gray-900 dark:text-white">{paymentDetail.paymentCode}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Status</span><span className="text-green-600 font-medium">{paymentDetail.paymentStatus}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Method</span><span className="text-gray-900 dark:text-white">{paymentDetail.paymentMethod === "CASH" ? "Cash" : "MoMo"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Amount</span><span className="font-bold text-gray-900 dark:text-white">{formatCurrency(paymentDetail.totalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Paid At</span><span className="text-gray-900 dark:text-white">{paymentDetail.paidAt ? new Date(paymentDetail.paidAt).toLocaleString("en-US") : "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Collected By</span><span className="text-gray-900 dark:text-white">{paymentDetail.processedByName || "—"}</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={handlePrintReceipt} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 text-sm font-medium">Print</button>
                <button onClick={handleDownloadPDF} className="flex-1 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 text-sm font-medium">Download PDF</button>
                <button onClick={() => setShowReceiptView(false)} className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium">Close</button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
