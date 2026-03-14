import { useEffect, useState, useRef } from "react";
import patientService, {
  type Payment,
  type PaymentQrDTO,
  type PaymentInitDTO,
} from "../../services/patientService";

export default function MomoQrModal({
  payment,
  onClose,
  onPaymentSuccess,
}: {
  payment: Payment;
  onClose: () => void;
  onPaymentSuccess: () => void;
}) {
  const [step, setStep] = useState<"loading" | "qr" | "error" | "success">("loading");
  const [initData, setInitData] = useState<PaymentInitDTO | null>(null);
  const [qrData, setQrData] = useState<PaymentQrDTO | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initMomo();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const initMomo = async () => {
    setStep("loading");
    setErrorMsg("");
    try {
      const init = await patientService.initMomoPayment(payment.id);
      setInitData(init);

      if (!init.success) {
        setErrorMsg(init.message || "Failed to initialize MoMo payment");
        setStep("error");
        return;
      }

      try {
        const qr = await patientService.getPaymentQr(payment.id);
        setQrData(qr);
      } catch {
        // QR might not be ready yet, use payUrl from init
      }

      setStep("qr");
      startPolling();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initialize MoMo payment";
      setErrorMsg(msg);
      setStep("error");
    }
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const updated = await patientService.getPaymentDetail(payment.id);
        if (updated.paymentStatus === "PAID") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep("success");
          setTimeout(() => onPaymentSuccess(), 2000);
        } else if (updated.paymentStatus === "CANCELLED" || updated.paymentStatus === "FAILED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setErrorMsg("Payment was " + updated.paymentStatus.toLowerCase());
          setStep("error");
        }
      } catch {
        // ignore poll errors
      }
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">MoMo Payment</h2>
              <p className="text-blue-100 text-xs">{payment.paymentCode}</p>
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
          {/* Amount */}
          <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
            <p className="text-sm text-gray-500 dark:text-gray-400">Payment Amount</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {payment.totalAmount?.toLocaleString("en-US")} <span className="text-lg">VND</span>
            </p>
          </div>

          {step === "loading" && (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 mx-auto border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Generating MoMo QR code...</p>
            </div>
          )}

          {step === "qr" && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="bg-white rounded-xl p-4 border-2 border-dashed border-blue-200 dark:border-blue-700">
                {qrData?.qrPayload ? (
                  <img
                    src={qrData.qrPayload}
                    alt="MoMo QR Code"
                    className="mx-auto w-56 h-56 rounded-lg"
                  />
                ) : initData?.qrCodeUrl ? (
                  <img
                    src={initData.qrCodeUrl}
                    alt="MoMo QR Code"
                    className="mx-auto w-56 h-56 rounded-lg"
                  />
                ) : (
                  <div className="mx-auto w-56 h-56 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-400 text-center px-4">
                      QR code unavailable.
                      <br />Please use the link below.
                    </p>
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Open <span className="font-semibold text-pink-500">MoMo</span> app and scan the QR code to pay
              </p>

              {/* Pay URL link */}
              {(qrData?.payUrl || initData?.payUrl) && (
                <a
                  href={qrData?.payUrl || initData?.payUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2.5 rounded-xl bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition-colors"
                >
                  Open MoMo to Pay
                </a>
              )}

              {/* Expiry */}
              {qrData?.expiresAt && (
                <p className="text-xs text-center text-gray-400">
                  Expires: {new Date(qrData.expiresAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              )}

              {/* Polling indicator */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Waiting for payment confirmation...
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Payment Successful!</h3>
              <p className="text-sm text-gray-500">Updating...</p>
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-red-500">{errorMsg}</p>
              <button
                onClick={initMomo}
                className="px-6 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
