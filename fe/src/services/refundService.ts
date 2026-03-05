import api from './api';

// ==================== TYPES (matching BE DTOs) ====================

export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type RefundReason =
  | 'PATIENT_CANCELLED_WITHIN_POLICY'
  | 'DOCTOR_CANCELLED'
  | 'DUPLICATE_PAYMENT'
  | 'PAYMENT_ERROR'
  | 'CHARGED_TWICE'
  | 'SERVICE_NOT_PROVIDED'
  | 'DISPUTE_RESOLUTION'
  | 'OTHER';

export type RefundMethod = 'CASH' | 'MOMO' | 'BANK_TRANSFER' | 'VNPAY' | 'ZALOPAY' | 'CARD' | 'ORIGINAL_METHOD';

export type RefundType = 'AUTO' | 'MANUAL';

/**
 * Matches BE RefundResponseDTO - used for list items
 */
export interface RefundDTO {
  id: number;
  refundCode: string;

  // Payment info
  paymentId: number;
  paymentCode: string;
  paymentMethod: string;

  // Amount info
  refundAmount: number;
  originalAmount: number;
  currency: string;

  // Status
  status: RefundStatus;
  refundReason: string;          // Free text reason
  refundReasonType: string;      // RefundReason enum name
  refundMethod: string;          // RefundMethod enum name
  refundType: string;            // AUTO or MANUAL
  urgent: boolean;
  retryCount: number;

  // Approval info
  approvedDate?: string;
  approvedById?: number;
  approvedByName?: string;

  // Patient info
  patientId: number;
  patientName: string;
  patientEmail: string;

  // Doctor info
  doctorId?: number;
  doctorName?: string;

  // Appointment info
  appointmentId?: number;
  appointmentCode?: string;

  // Request info
  requestedDate: string;
  requestedById: number;
  requestedByName: string;

  // Processing info
  processedDate?: string;
  processedById?: number;
  processedByName?: string;
  transactionReference?: string;

  // Rejection info
  rejectedDate?: string;
  rejectedById?: number;
  rejectedByName?: string;
  rejectionReason?: string;

  // Notes
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Matches BE RefundDetailDTO
 */
export interface RefundDetailDTO {
  // Refund Info
  id: number;
  refundCode: string;
  status: RefundStatus;
  refundReason: string;
  refundReasonType: string;
  refundMethod: string;
  refundType: string;
  urgent: boolean;
  retryCount: number;
  maxRetries: number;

  // Amount Info
  refundAmount: number;
  originalAmount: number;
  currency: string;
  refundPercentage: number;

  // Payment Info
  paymentId: number;
  paymentCode: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate?: string;
  transactionId?: string;

  // Patient Info
  patientId: number;
  patientName: string;
  patientEmail: string;
  patientPhone: string;

  // Doctor Info
  doctorId?: number;
  doctorName?: string;
  doctorSpecialization?: string;

  // Appointment Info
  appointmentId?: number;
  appointmentCode?: string;
  appointmentDate?: string;
  appointmentStatus?: string;

  // Request Info
  requestedDate: string;
  requestedById: number;
  requestedByName: string;

  // Approval Info
  approvedDate?: string;
  approvedById?: number;
  approvedByName?: string;

  // Processing Info
  processedDate?: string;
  processedById?: number;
  processedByName?: string;
  transactionReference?: string;
  gatewayRefundId?: string;
  processingNotes?: string;

  // Evidence (manual/cash refunds)
  evidenceUrl?: string;
  cashierConfirmed?: boolean;
  workstationId?: string;

  // Rejection Info
  rejectedDate?: string;
  rejectedById?: number;
  rejectedByName?: string;
  rejectionReason?: string;

  // Notes
  notes?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;

  // History timeline
  history: RefundHistoryEvent[];
}

/**
 * Matches BE RefundDetailDTO.RefundHistoryEvent
 */
export interface RefundHistoryEvent {
  id: number;
  eventType: string;
  description: string;
  previousStatus?: string;
  newStatus?: string;
  performedById?: number;
  performedByName: string;
  eventTime: string;
}

/**
 * Matches BE RefundStatsDTO
 */
export interface RefundStatsDTO {
  totalRefunds: number;
  totalRefundAmount: number;

  // By status counts
  requestedCount: number;
  approvedCount: number;
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  rejectedCount: number;

  // Pending & completed value
  pendingAmount: number;
  completedAmount: number;

  // Refund rate
  refundRate: number;

  // By payment method
  refundsByPaymentMethod: Record<string, number>;
  refundAmountByPaymentMethod: Record<string, number>;

  // Average processing time (hours)
  averageProcessingTime: number;

  // Period info
  fromDate?: string;
  toDate?: string;
}

/**
 * Matches BE RefundDTO (request body for creating refund)
 */
export interface CreateRefundDTO {
  refundAmount: number;
  refundReason: string;
  refundReasonType?: string;
  refundMethod?: string;
  refundType?: string;
  notes?: string;
  transactionId?: string;
  description?: string;
}

/**
 * Matches BE ApproveRefundDTO
 */
export interface ApproveRefundDTO {
  approvalNotes?: string;
  sendNotification?: boolean;
}

/**
 * Matches BE RejectRefundDTO
 */
export interface RejectRefundDTO {
  rejectionReason: string;
  sendNotification?: boolean;
}

/**
 * Matches BE ProcessRefundDTO
 */
export interface ProcessRefundDTO {
  processedDate?: string;
  transactionReference?: string;
  processingNotes?: string;
  refundMethod?: string;
  refundType?: string;
  evidenceUrl?: string;
  workstationId?: string;
  cashierConfirmed?: boolean;
  sendNotification?: boolean;
}

/**
 * Matches BE RetryRefundDTO
 */
export interface RetryRefundDTO {
  refundMethod?: string;
  refundType?: string;
  notes?: string;
  sendNotification?: boolean;
}

/**
 * Filter params matching BE controller query params
 */
export interface RefundFilterParams {
  searchTerm?: string;
  status?: string;
  refundMethod?: string;
  refundReasonType?: string;
  from?: string;
  to?: string;
  patientId?: number;
  doctorId?: number;
  minAmount?: number;
  maxAmount?: number;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ==================== CONSTANTS ====================

export const REFUND_STATUS_OPTIONS: { value: RefundStatus; label: string }[] = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
];

export const REFUND_REASON_OPTIONS: { value: RefundReason; label: string }[] = [
  { value: 'PATIENT_CANCELLED_WITHIN_POLICY', label: 'Patient cancelled within policy' },
  { value: 'DOCTOR_CANCELLED', label: 'Doctor cancelled' },
  { value: 'DUPLICATE_PAYMENT', label: 'Duplicate payment' },
  { value: 'PAYMENT_ERROR', label: 'Payment error' },
  { value: 'CHARGED_TWICE', label: 'Charged twice' },
  { value: 'SERVICE_NOT_PROVIDED', label: 'Service not provided' },
  { value: 'DISPUTE_RESOLUTION', label: 'Dispute resolution' },
  { value: 'OTHER', label: 'Other (note required)' },
];

export const REFUND_METHOD_OPTIONS: { value: RefundMethod; label: string; icon: string }[] = [
  { value: 'ORIGINAL_METHOD', label: 'Original Payment Method', icon: '🔄' },
  { value: 'CASH', label: 'Cash', icon: '💵' },
  { value: 'MOMO', label: 'MoMo', icon: '📱' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦' },
  { value: 'VNPAY', label: 'VNPay', icon: '💳' },
  { value: 'ZALOPAY', label: 'ZaloPay', icon: '📲' },
  { value: 'CARD', label: 'Card', icon: '💳' },
];

// ==================== API FUNCTIONS ====================

/**
 * Get all refunds with filters
 * GET /api/admin/refunds
 */
export const getAllRefunds = async (
  params: RefundFilterParams
): Promise<PageResponse<RefundDTO>> => {
  const response = await api.get('/admin/refunds', { params });
  return response.data;
};

/**
 * Get refund statistics
 * GET /api/admin/refunds/statistics
 */
export const getRefundStatistics = async (
  from?: string,
  to?: string
): Promise<RefundStatsDTO> => {
  const response = await api.get('/admin/refunds/statistics', {
    params: { from, to },
  });
  return response.data;
};

/**
 * Get refund detail by ID
 * GET /api/admin/refunds/{id}
 */
export const getRefundDetail = async (id: number): Promise<RefundDetailDTO> => {
  const response = await api.get(`/admin/refunds/${id}`);
  return response.data;
};

/**
 * Create a new refund request
 * POST /api/admin/refunds?paymentId={paymentId}
 */
export const createRefund = async (paymentId: number, dto: CreateRefundDTO): Promise<RefundDTO> => {
  const response = await api.post('/admin/refunds', dto, {
    params: { paymentId },
  });
  return response.data;
};

/**
 * Approve a refund request
 * PATCH /api/admin/refunds/{id}/approve
 */
export const approveRefund = async (
  id: number,
  dto: ApproveRefundDTO
): Promise<RefundDTO> => {
  const response = await api.patch(`/admin/refunds/${id}/approve`, dto);
  return response.data;
};

/**
 * Reject a refund request
 * PATCH /api/admin/refunds/{id}/reject
 */
export const rejectRefund = async (
  id: number,
  dto: RejectRefundDTO
): Promise<RefundDTO> => {
  const response = await api.patch(`/admin/refunds/${id}/reject`, dto);
  return response.data;
};

/**
 * Process a refund (auto or manual)
 * PATCH /api/admin/refunds/{id}/process
 */
export const processRefund = async (
  id: number,
  dto: ProcessRefundDTO
): Promise<RefundDTO> => {
  const response = await api.patch(`/admin/refunds/${id}/process`, dto);
  return response.data;
};

/**
 * Retry a failed refund
 * PATCH /api/admin/refunds/{id}/retry
 */
export const retryRefund = async (
  id: number,
  dto: RetryRefundDTO
): Promise<RefundDTO> => {
  const response = await api.patch(`/admin/refunds/${id}/retry`, dto);
  return response.data;
};

/**
 * Export refunds report
 * GET /api/admin/refunds/export
 */
export const exportRefunds = async (
  params: RefundFilterParams & { format: string }
): Promise<Blob> => {
  const response = await api.get('/admin/refunds/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};

// ==================== HELPER FUNCTIONS ====================

export type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

export const getRefundStatusColor = (status: RefundStatus | string): BadgeColor => {
  switch (status) {
    case 'REQUESTED': return 'warning';
    case 'APPROVED': return 'info';
    case 'PENDING': return 'light';
    case 'REJECTED': return 'dark';
    case 'PROCESSING': return 'primary';
    case 'COMPLETED': return 'success';
    case 'FAILED': return 'error';
    default: return 'light';
  }
};

export const getRefundStatusIcon = (status: RefundStatus | string): string => {
  switch (status) {
    case 'REQUESTED': return '📋';
    case 'APPROVED': return '✅';
    case 'PENDING': return '⏱';
    case 'REJECTED': return '🚫';
    case 'PROCESSING': return '⏳';
    case 'COMPLETED': return '💰';
    case 'FAILED': return '❌';
    default: return '❓';
  }
};

export const getRefundReasonLabel = (reason: string): string => {
  return REFUND_REASON_OPTIONS.find(o => o.value === reason)?.label || reason;
};

export const getRefundMethodLabel = (method: string): string => {
  return REFUND_METHOD_OPTIONS.find(o => o.value === method)?.label || method;
};

export const getRefundMethodIcon = (method: string): string => {
  return REFUND_METHOD_OPTIONS.find(o => o.value === method)?.icon || '💳';
};

export const formatCurrency = (amount: number, currency: string = 'VND') => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
  }).format(amount);
};

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

export default {
  getAllRefunds,
  getRefundStatistics,
  getRefundDetail,
  createRefund,
  approveRefund,
  rejectRefund,
  processRefund,
  retryRefund,
  exportRefunds,
  getRefundStatusColor,
  getRefundStatusIcon,
  getRefundReasonLabel,
  getRefundMethodLabel,
  getRefundMethodIcon,
  formatCurrency,
  downloadFile,
};
