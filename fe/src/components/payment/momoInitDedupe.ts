import patientService, {
  type PaymentInitDTO,
  type PaymentQrDTO,
} from "../../services/patientService";

type MomoInitBundle = { init: PaymentInitDTO; qr: PaymentQrDTO | null };

const inflight = new Map<number, Promise<MomoInitBundle>>();

/**
 * Ensures only one MoMo init + QR fetch runs per payment id at a time (React Strict Mode / double requests).
 */
export function initMomoPaymentDeduped(paymentId: number): Promise<MomoInitBundle> {
  const existing = inflight.get(paymentId);
  if (existing) {
    return existing;
  }
  const promise = (async (): Promise<MomoInitBundle> => {
    const init = await patientService.initMomoPayment(paymentId);
    let qr: PaymentQrDTO | null = null;
    if (init.success) {
      try {
        qr = await patientService.getPaymentQr(paymentId);
      } catch {
        // QR optional; modal can fall back to init payUrl / qrCodeUrl
      }
    }
    return { init, qr };
  })();
  inflight.set(paymentId, promise);
  promise.finally(() => {
    inflight.delete(paymentId);
  });
  return promise;
}
