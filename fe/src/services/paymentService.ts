import api from './api';

// ==================== TYPES ====================

export interface PaymentDTO {
  id: number;
  transactionCode: string;
  paymentDate: string;
  patientName: string;
  doctorName: string;
  appointmentCode: string;
  amount: number;
  totalAmount: number;
  paymentMethod: string;
  status: 'PENDING' | 'PAID' | 'INITIATED' | 'PROCESSING' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED';
  paymentStatus: string;
  currency: string;
  prescriptionId?: number;
  prescriptionCode?: string;
  referenceType?: 'APPOINTMENT' | 'PRESCRIPTION';
}

export interface PaymentDetailDTO {
  id: number;
  transactionCode: string;
  paymentCode: string;
  status: 'PENDING' | 'PAID' | 'INITIATED' | 'PROCESSING' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED';
  paymentStatus: string;
  paymentDate: string;
  createdDate: string;
  createdAt: string;
  lastUpdated: string;
  updatedAt: string;
  amount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  transactionFee: number;
  netAmount: number;
  tax: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientId: number;
  doctorName: string;
  doctorSpecialization: string;
  doctorId: number;
  appointmentCode: string;
  appointmentDate: string;
  appointmentType: string;
  appointmentStatus: string;
  appointmentId: number;
  gatewayName?: string;
  gatewayTransactionId?: string;
  gatewayStatus?: string;
  gatewayResponse?: string;
  isRefunded?: boolean;
  refundAmount?: number;
  refundDate?: string;
  refundReason?: string;
  refundedBy?: string;
  refundedByName?: string;
  refundStatus?: string;
  processedBy?: number;
  processedByName?: string;
  notes?: string;
  adminNotes?: string;
  patientNotes?: string;
  invoiceId?: number;
  invoiceNumber?: string;
  invoiceStatus?: string;
}

export interface PaymentStatsDTO {
  // Today's revenue
  todayRevenue: number;
  todayTransactionCount: number;
  todayAverageTransaction: number;
  // This month's revenue
  monthRevenue: number;
  lastMonthRevenue: number;
  monthGrowthPercentage: number;
  monthTransactionCount: number;
  // Payment methods distribution
  paymentMethodsDistribution: {
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }[];
  // Pending payments
  pendingCount: number;
  pendingAmount: number;
  // Refund statistics
  totalRefundedThisMonth: number;
  refundCountThisMonth: number;
  refundRatePercentage: number;
  // Status breakdown
  statusCounts: Record<string, number>;
  // Date range
  fromDate: string;
  toDate: string;
}

export interface PaymentHistoryDTO {
  paymentId?: number;
  paymentCode?: string;
  events: {
    id?: number;
    eventType: string;
    event: string;
    description: string;
    previousValue?: string;
    newValue?: string;
    performedByName?: string;
    performedById?: number;
    eventTime: string;
    timestamp: string;
    user?: string;
    metadata?: any;
  }[];
}

export interface PaymentBulkResultDTO {
  success: number;
  failed: number;
  errors?: string[];
}

export interface BulkMarkPaidDTO {
  paymentIds: number[];
  paymentMethod: string;
  notes?: string;
}

export interface MarkPaidDTO {
  paymentMethod?: string;
  notes?: string;
}

export interface RefundDTO {
  refundAmount: number;
  refundReason: string;
  notes?: string;
  transactionId?: string;
  description?: string;
}

export interface CancelPaymentDTO {
  reason: string;
  notes?: string;
}

export interface RetryPaymentDTO {
  sendVia: 'EMAIL' | 'SMS';
}

export interface SendReceiptDTO {
  email: string;
}

export interface MessageDTO {
  message: string;
  success: boolean;
}

export interface PaymentFilterParams {
  search?: string;
  status?: string;
  paymentMethod?: string;
  doctorId?: number;
  patientId?: number;
  minAmount?: number;
  maxAmount?: number;
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

/** Extension for downloaded file (backend: EXCEL → XLSX, CSV, PDF only). */
export function paymentExportFileExtension(format: string): string {
  switch (format.toUpperCase()) {
    case 'CSV':
      return 'csv';
    case 'PDF':
      return 'pdf';
    case 'EXCEL':
    default:
      return 'xlsx';
  }
}

async function readBlobErrorMessage(blob: Blob): Promise<string> {
  try {
    const text = await blob.text();
    if (!text?.trim()) return 'Export failed';
    try {
      const j = JSON.parse(text) as { message?: string; error?: string; detail?: string };
      return j.message || j.error || (typeof j.detail === 'string' ? j.detail : '') || text.slice(0, 300);
    } catch {
      return text.slice(0, 300);
    }
  } catch {
    return 'Export failed';
  }
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ==================== API FUNCTIONS ====================

/**
 * Get all payments with advanced filters
 * GET /api/admin/payments
 */
export const getAllPayments = async (
  params: PaymentFilterParams
): Promise<PageResponse<PaymentDTO>> => {
  const response = await api.get('/admin/payments', { params });
  return response.data;
};

/**
 * Get payment statistics for dashboard
 * GET /api/admin/payments/statistics
 */
export const getPaymentStatistics = async (
  from?: string,
  to?: string
): Promise<PaymentStatsDTO> => {
  const response = await api.get('/admin/payments/statistics', {
    params: { from, to },
  });
  return response.data;
};

/**
 * Bulk mark multiple pending payments as paid
 * POST /api/admin/payments/bulk/mark-paid
 */
export const bulkMarkAsPaid = async (
  dto: BulkMarkPaidDTO
): Promise<PaymentBulkResultDTO> => {
  const response = await api.post('/admin/payments/bulk/mark-paid', dto);
  return response.data;
};

/**
 * Export filtered transactions to file
 * GET /api/admin/payments/export
 */
export const exportPayments = async (
  params: PaymentFilterParams & { format: string }
): Promise<Blob> => {
  try {
    const response = await api.get('/admin/payments/export', {
      params,
      responseType: 'blob',
    });
    const blob = response.data as Blob;
    // Some error responses are JSON with responseType blob
    if (blob.type?.includes('application/json')) {
      throw new Error(await readBlobErrorMessage(blob));
    }
    return blob;
  } catch (err: unknown) {
    const ax = err as { response?: { data?: unknown } };
    const data = ax?.response?.data;
    if (data instanceof Blob) {
      throw new Error(await readBlobErrorMessage(data));
    }
    throw err;
  }
};

/**
 * Get comprehensive payment detail
 * GET /api/admin/payments/{id}
 */
export const getPaymentDetail = async (id: number): Promise<PaymentDetailDTO> => {
  const response = await api.get(`/admin/payments/${id}`);
  return response.data;
};

/**
 * Manually mark payment as paid
 * POST /api/admin/payments/{id}/mark-paid
 */
export const markPaymentAsPaid = async (
  id: number,
  dto: MarkPaidDTO
): Promise<PaymentDTO> => {
  const response = await api.post(`/admin/payments/${id}/mark-paid`, dto);
  return response.data;
};

/**
 * Retry payment - resend payment link
 * POST /api/admin/payments/{id}/retry
 */
export const retryPayment = async (
  id: number,
  dto: RetryPaymentDTO
): Promise<MessageDTO> => {
  const response = await api.post(`/admin/payments/${id}/retry`, dto);
  return response.data;
};

/**
 * Send payment receipt to patient
 * POST /api/admin/payments/{id}/send-receipt
 */
export const sendReceipt = async (
  id: number,
  dto: SendReceiptDTO
): Promise<MessageDTO> => {
  const response = await api.post(`/admin/payments/${id}/send-receipt`, dto);
  return response.data;
};

/**
 * Download payment receipt as PDF
 * GET /api/admin/payments/{id}/receipt
 */
export const downloadReceipt = async (id: number): Promise<Blob> => {
  const response = await api.get(`/admin/payments/${id}/receipt`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get payment history/timeline
 * GET /api/admin/payments/{id}/history
 */
export const getPaymentHistory = async (id: number): Promise<PaymentHistoryDTO> => {
  const response = await api.get(`/admin/payments/${id}/history`);
  return response.data;
};

/**
 * Refund payment (cash or MoMo)
 * POST /api/admin/payments/{id}/refund
 */
export const refundPayment = async (
  id: number,
  dto: RefundDTO
): Promise<PaymentDTO> => {
  const response = await api.post(`/admin/payments/${id}/refund`, dto);
  return response.data;
};

/**
 * Cancel payment (admin override)
 * PATCH /api/admin/payments/{id}/cancel
 */
export const cancelPayment = async (
  id: number,
  dto: CancelPaymentDTO
): Promise<PaymentDTO> => {
  const response = await api.patch(`/admin/payments/${id}/cancel`, dto);
  return response.data;
};

/**
 * Reconcile MoMo payment status
 * POST /api/admin/payments/{id}/reconcile/momo
 */
export const reconcileMomoStatus = async (id: number): Promise<PaymentDTO> => {
  const response = await api.post(`/admin/payments/${id}/reconcile/momo`);
  return response.data;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Download a file from blob data
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Format currency (VND)
 */
export const formatCurrency = (amount: number, currency: string = 'VND') => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Badge color type (matching Badge component)
 */
export type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

/**
 * Get status badge color
 */
export const getStatusColor = (status: string): BadgeColor => {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'PAID':
      return 'success';
    case 'INITIATED':
    case 'PROCESSING':
      return 'info';
    case 'FAILED':
      return 'error';
    case 'REFUNDED':
      return 'info';
    case 'CANCELLED':
    case 'EXPIRED':
      return 'light';
    default:
      return 'light';
  }
};

/**
 * Get payment method icon
 */
export const getPaymentMethodIcon = (method: string): string => {
  switch (method) {
    case 'CASH':
      return '💵';
    case 'MOMO':
      return '📱';
    default:
      return '💳';
  }
};

/**
 * Get payment method label
 */
export const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    CASH: 'Cash',
    CARD: 'Card',
    BANK_TRANSFER: 'Bank Transfer',
    E_WALLET: 'E-Wallet',
    INSURANCE: 'Insurance',
    MOMO: 'MoMo',
    ZALOPAY: 'ZaloPay',
    VNPAY: 'VNPay',
  };
  return labels[method] || method;
};

// ==================== RECEPTIONIST PAYMENT API ====================

export interface ReceptionistPaymentCreateDTO {
  appointmentId: number;
  paymentMethod: 'CASH' | 'MOMO';
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export interface PrescriptionPaymentCreateDTO {
  prescriptionId: number;
  paymentMethod: 'CASH' | 'MOMO';
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export interface MarkCashDTO {
  amountReceived?: number;
  changeGiven?: number;
  transactionId?: string;
  notes?: string;
  printReceipt?: boolean;
  emailReceipt?: boolean;
  smsReceipt?: boolean;
}

export interface PaymentInitResult {
  paymentId: number;
  paymentCode: string;
  payUrl: string;
  qrCodeUrl: string;
  orderId: string;
  message: string;
  success: boolean;
}

export interface PaymentQrResult {
  id: number;
  paymentId: number;
  provider: string;
  qrPayload: string;
  qrDataUrl?: string;
  payUrl: string;
  expiresAt: string;
  status: string;
  createdAt: string;
}

/**
 * Create payment for an appointment (receptionist)
 * POST /api/receptionist/payments
 */
export const createReceptionistPayment = async (dto: ReceptionistPaymentCreateDTO): Promise<PaymentDTO> => {
  const response = await api.post('/receptionist/payments', dto);
  return response.data;
};

/**
 * Create prescription payment (receptionist)
 * POST /api/receptionist/payments/prescription
 */
export const createPrescriptionPayment = async (dto: PrescriptionPaymentCreateDTO): Promise<PaymentDTO> => {
  const response = await api.post('/receptionist/payments/prescription', dto);
  return response.data;
};

/**
 * Initialize MoMo payment (receptionist)
 * POST /api/receptionist/payments/{id}/momo/init
 */
export const initMomoPayment = async (paymentId: number): Promise<PaymentInitResult> => {
  const response = await api.post(`/receptionist/payments/${paymentId}/momo/init`, {});
  return response.data;
};

/**
 * Get QR code for payment (receptionist)
 * GET /api/receptionist/payments/{id}/qr
 */
export const getPaymentQr = async (paymentId: number): Promise<PaymentQrResult> => {
  const response = await api.get(`/receptionist/payments/${paymentId}/qr`);
  return response.data;
};

/**
 * Refresh QR code (receptionist)
 * POST /api/receptionist/payments/{id}/qr/refresh
 */
export const refreshPaymentQr = async (paymentId: number): Promise<PaymentInitResult> => {
  const response = await api.post(`/receptionist/payments/${paymentId}/qr/refresh`);
  return response.data;
};

/**
 * Mark payment as paid with cash (receptionist)
 * PATCH /api/receptionist/payments/{id}/mark-cash
 */
export const markPaymentCash = async (paymentId: number, dto?: MarkCashDTO): Promise<PaymentDTO> => {
  const response = await api.patch(`/receptionist/payments/${paymentId}/mark-cash`, dto || {});
  return response.data;
};

/**
 * Cancel payment (receptionist)
 * PATCH /api/receptionist/payments/{id}/cancel
 */
export const cancelReceptionistPayment = async (paymentId: number, reason?: string): Promise<PaymentDTO> => {
  const response = await api.patch(`/receptionist/payments/${paymentId}/cancel`, { reason: reason || 'Cancelled by receptionist' });
  return response.data;
};

/**
 * Get payment by ID (receptionist)
 * GET /api/receptionist/payments/{id}
 */
export const getReceptionistPayment = async (paymentId: number): Promise<PaymentDTO> => {
  const response = await api.get(`/receptionist/payments/${paymentId}`);
  return response.data;
};

export default {
  getAllPayments,
  getPaymentStatistics,
  bulkMarkAsPaid,
  paymentExportFileExtension,
  exportPayments,
  getPaymentDetail,
  markPaymentAsPaid,
  retryPayment,
  sendReceipt,
  downloadReceipt,
  getPaymentHistory,
  refundPayment,
  cancelPayment,
  reconcileMomoStatus,
  createReceptionistPayment,
  createPrescriptionPayment,
  initMomoPayment,
  getPaymentQr,
  refreshPaymentQr,
  markPaymentCash,
  cancelReceptionistPayment,
  getReceptionistPayment,
  downloadFile,
  formatCurrency,
  getStatusColor,
  getPaymentMethodIcon,
  getPaymentMethodLabel,
};
