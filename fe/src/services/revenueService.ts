import api from './api';

// ==================== TYPES ====================
// These FE types stay stable — adapter functions below transform BE responses.

export type DatePreset = 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  preset: DatePreset;
}

// Revenue Summary (FE shape — mapped from BE RevenueSummaryDTO)
export interface RevenueSummaryDTO {
  grossRevenue: number;
  netRevenue: number;
  refundedAmount: number;
  pendingAmount: number;
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  averageTransactionValue: number;
  refundCount: number;
  refundRate: number;
  currency: string;
  // Period comparison
  previousGrossRevenue: number;
  previousNetRevenue: number;
  grossRevenueChange: number;
  netRevenueChange: number;
  transactionCountChange: number;
  // Extra from BE
  dailyAverageRevenue: number;
  peakRevenueDay: string | null;
  peakDayRevenue: number;
  totalDays: number;
}

// Daily revenue data point for line chart
export interface DailyRevenueDTO {
  date: string; // YYYY-MM-DD
  grossRevenue: number;
  netRevenue: number;
  refundedAmount: number;
  transactionCount: number;
}

// Previous period daily data for comparison
export interface DailyRevenueComparisonDTO {
  currentPeriod: DailyRevenueDTO[];
  previousPeriod: DailyRevenueDTO[];
}

// Payment method breakdown (FE shape — mapped from BE PaymentMethodRevenueDTO.MethodBreakdown)
export interface MethodRevenueDTO {
  method: string;
  displayName: string;
  grossRevenue: number;
  refundedAmount: number;
  netRevenue: number;
  transactionCount: number;
  percentage: number;
  averageAmount: number;
  successRate: number;
}

// Doctor revenue breakdown (FE shape — mapped from BE DoctorRevenueDTO)
export interface DoctorRevenueDTO {
  doctorId: number;
  doctorName: string;
  specialization: string;
  grossRevenue: number;
  netRevenue: number;
  transactionCount: number;
  averageFee: number;
  refundCount: number;
  refundRate: number;
  refundAmount: number;
  rank: number;
}

// Appointment type breakdown (FE shape — mapped from BE AppointmentTypeRevenueDTO.TypeBreakdown)
export interface AppointmentTypeRevenueDTO {
  appointmentType: string;
  displayName: string;
  grossRevenue: number;
  netRevenue: number;
  transactionCount: number;
  percentage: number;
  averageFee: number;
  completionRate: number;
}

// Refund analysis
export interface RefundAnalysisDTO {
  totalRefunded: number;
  refundCount: number;
  averageRefundAmount: number;
  refundRate: number;
  reasonDistribution: RefundReasonBreakdown[];
  trendData: RefundTrendPoint[];
  refundRateTrend: RefundRateTrendPoint[];
}

export interface RefundReasonBreakdown {
  reason: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface RefundTrendPoint {
  date: string;
  amount: number;
  count: number;
}

export interface RefundRateTrendPoint {
  date: string;
  rate: number;
  completedCount: number;
  refundCount: number;
}

// Drill-down transaction list
export interface DrillDownTransaction {
  id: number;
  transactionCode: string;
  paymentDate: string;
  patientName: string;
  doctorName: string;
  amount: number;
  paymentMethod: string;
  status: string;
  appointmentType: string;
}

export interface DrillDownParams {
  date?: string;
  method?: string;
  doctorId?: number;
  appointmentType?: string;
  startDate: string;
  endDate: string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Export & Schedule
export type ExportFormat = 'pdf' | 'excel';

export interface ExportReportDTO {
  format: ExportFormat;
  startDate: string;
  endDate: string;
  sections: ExportSection[];
  includeCharts?: boolean;
}

export type ExportSection = 'summary' | 'transactions' | 'methods' | 'doctors' | 'appointments' | 'refunds';

export interface ScheduleReportDTO {
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  sections: ExportSection[];
  format: ExportFormat;
  active: boolean;
}

export interface ScheduledReportDTO {
  id: number;
  frequency: string;
  recipients: string[];
  sections: ExportSection[];
  format: ExportFormat;
  active: boolean;
  lastSentAt: string | null;
  nextSendAt: string;
  createdBy: string;
}

// ==================== API FUNCTIONS (adapter: BE → FE) ====================
// Base path WITHOUT /api prefix because axios baseURL already includes /api
const BASE = '/admin/revenue';

/**
 * GET /admin/revenue/summary?from=&to=&compareWithPrevious=true
 * BE returns: RevenueSummaryDTO (totalRevenue, netRevenue, totalRefunds, ...)
 * FE wants:  RevenueSummaryDTO (grossRevenue, refundedAmount, pendingAmount, ...)
 */
export async function getRevenueSummary(startDate: string, endDate: string): Promise<RevenueSummaryDTO> {
  const res = await api.get(`${BASE}/summary`, {
    params: { from: startDate, to: endDate, compareWithPrevious: true },
  });
  const be = res.data;
  return {
    grossRevenue: Number(be.totalRevenue) || 0,
    netRevenue: Number(be.netRevenue) || 0,
    refundedAmount: Number(be.totalRefunds) || 0,
    pendingAmount: Number(be.pendingRevenue) || 0,
    totalTransactions: Number(be.totalTransactions) || 0,
    completedTransactions: (Number(be.totalTransactions) || 0) - (Number(be.refundCount) || 0),
    pendingTransactions: 0,
    averageTransactionValue: Number(be.averageTransactionValue) || 0,
    refundCount: Number(be.refundCount) || 0,
    refundRate:
      Number(be.totalTransactions) > 0
        ? (Number(be.refundCount) / Number(be.totalTransactions)) * 100
        : 0,
    currency: 'VND',
    previousGrossRevenue: Number(be.previousPeriodRevenue) || 0,
    previousNetRevenue: 0,
    grossRevenueChange: Number(be.revenueGrowthPercent) || 0,
    netRevenueChange: Number(be.revenueGrowthPercent) || 0,
    transactionCountChange: Number(be.transactionGrowthPercent) || 0,
    dailyAverageRevenue: Number(be.dailyAverageRevenue) || 0,
    peakRevenueDay: be.peakRevenueDay || null,
    peakDayRevenue: Number(be.peakDayRevenue) || 0,
    totalDays: Number(be.totalDays) || 0,
  };
}

/**
 * GET /admin/revenue/chart?from=&to=&groupBy=DAY
 * BE returns: RevenueChartDTO { dataPoints: DataPoint[], ... }
 * FE wants:  DailyRevenueComparisonDTO { currentPeriod, previousPeriod }
 */
export async function getDailyRevenue(
  startDate: string,
  endDate: string,
  compare?: boolean,
): Promise<DailyRevenueComparisonDTO> {
  const res = await api.get(`${BASE}/chart`, {
    params: { from: startDate, to: endDate, groupBy: 'DAY' },
  });
  const be = res.data;

  const currentPeriod: DailyRevenueDTO[] = (be.dataPoints || []).map((dp: any) => ({
    date: dp.period,
    grossRevenue: Number(dp.revenue) || 0,
    netRevenue: Number(dp.netRevenue) || 0,
    refundedAmount: Number(dp.refundAmount) || 0,
    transactionCount: Number(dp.transactionCount) || 0,
  }));

  const previousPeriod: DailyRevenueDTO[] =
    compare
      ? (be.dataPoints || [])
          .filter((dp: any) => dp.previousRevenue != null)
          .map((dp: any) => ({
            date: dp.period,
            grossRevenue: Number(dp.previousRevenue) || 0,
            netRevenue: Number(dp.previousRevenue) || 0,
            refundedAmount: 0,
            transactionCount: 0,
          }))
      : [];

  return { currentPeriod, previousPeriod };
}

/**
 * GET /admin/revenue/by-method?from=&to=
 * BE returns: PaymentMethodRevenueDTO { methods: MethodBreakdown[], ... }
 * FE wants:  MethodRevenueDTO[] (flat array)
 */
export async function getRevenueByMethod(
  startDate: string,
  endDate: string,
): Promise<MethodRevenueDTO[]> {
  const res = await api.get(`${BASE}/by-method`, {
    params: { from: startDate, to: endDate },
  });
  const be = res.data;

  return (be.methods || []).map((m: any) => ({
    method: m.method,
    displayName: m.displayName || PAYMENT_METHOD_LABELS[m.method] || m.method,
    grossRevenue: Number(m.revenue) || 0,
    refundedAmount: 0,
    netRevenue: Number(m.revenue) || 0,
    transactionCount: Number(m.transactionCount) || 0,
    percentage: Number(m.percentage) || 0,
    averageAmount: Number(m.averageAmount) || 0,
    successRate: Number(m.successRate) || 0,
  }));
}

/**
 * GET /admin/revenue/by-doctor?from=&to=&top=&sortBy=totalRevenue
 * BE returns: DoctorRevenueDTO[] (totalRevenue, refundAmount, ...)
 * FE wants:  DoctorRevenueDTO[] (grossRevenue, refundRate, ...)
 */
export async function getRevenueByDoctor(
  startDate: string,
  endDate: string,
  limit?: number,
): Promise<DoctorRevenueDTO[]> {
  const res = await api.get(`${BASE}/by-doctor`, {
    params: { from: startDate, to: endDate, top: limit ?? 10, sortBy: 'totalRevenue' },
  });

  return (res.data || []).map((d: any) => ({
    doctorId: d.doctorId,
    doctorName: d.doctorName || '',
    specialization: d.specialization || '',
    grossRevenue: Number(d.totalRevenue) || 0,
    netRevenue: Number(d.netRevenue) || 0,
    transactionCount: Number(d.transactionCount) || 0,
    averageFee: Number(d.averageFee) || 0,
    refundCount: Number(d.refundCount) || 0,
    refundAmount: Number(d.refundAmount) || 0,
    refundRate:
      Number(d.totalRevenue) > 0
        ? ((Number(d.refundAmount) || 0) / Number(d.totalRevenue)) * 100
        : 0,
    rank: Number(d.rank) || 0,
  }));
}

/**
 * GET /admin/revenue/by-appointment-type?from=&to=
 * BE returns: AppointmentTypeRevenueDTO { types: TypeBreakdown[], ... }
 * FE wants:  AppointmentTypeRevenueDTO[] (flat array)
 */
export async function getRevenueByAppointmentType(
  startDate: string,
  endDate: string,
  _includePrepay?: boolean,
): Promise<AppointmentTypeRevenueDTO[]> {
  const res = await api.get(`${BASE}/by-appointment-type`, {
    params: { from: startDate, to: endDate },
  });
  const be = res.data;

  return (be.types || []).map((t: any) => ({
    appointmentType: t.appointmentType,
    displayName: t.displayName || APPOINTMENT_TYPE_LABELS[t.appointmentType] || t.appointmentType,
    grossRevenue: Number(t.revenue) || 0,
    netRevenue: Number(t.revenue) || 0,
    transactionCount: Number(t.appointmentCount) || 0,
    percentage: Number(t.percentage) || 0,
    averageFee: Number(t.averageFee) || 0,
    completionRate: Number(t.completionRate) || 0,
  }));
}

/**
 * GET /admin/revenue/refund-analysis?from=&to=
 */
export async function getRefundAnalysis(
  startDate: string,
  endDate: string,
): Promise<RefundAnalysisDTO> {
  const res = await api.get(`${BASE}/refund-analysis`, {
    params: { from: startDate, to: endDate },
  });
  return res.data;
}

/**
 * GET /admin/revenue/drill-down?from=&to=&date=&method=&doctorId=&appointmentType=&page=&size=
 */
export async function getDrillDownTransactions(
  params: DrillDownParams,
): Promise<PageResponse<DrillDownTransaction>> {
  const res = await api.get(`${BASE}/drill-down`, {
    params: {
      from: params.startDate,
      to: params.endDate,
      date: params.date,
      method: params.method,
      doctorId: params.doctorId,
      appointmentType: params.appointmentType,
      page: params.page ?? 0,
      size: params.size ?? 15,
    },
  });
  return res.data;
}

/**
 * GET /admin/revenue/export?from=&to=&format=&includeCharts=
 * BE returns byte[] → FE gets as Blob
 */
export async function exportReport(data: ExportReportDTO): Promise<Blob> {
  const res = await api.get(`${BASE}/export`, {
    params: {
      from: data.startDate,
      to: data.endDate,
      format: data.format.toUpperCase(),
      includeCharts: data.includeCharts ?? true,
    },
    responseType: 'blob',
  });
  return res.data;
}

/**
 * Scheduled reports API (GET / POST / PUT / DELETE)
 */
export async function getScheduledReports(): Promise<ScheduledReportDTO[]> {
  const res = await api.get(`${BASE}/scheduled-reports`);
  return res.data;
}

export async function createScheduledReport(data: ScheduleReportDTO): Promise<ScheduledReportDTO> {
  const res = await api.post(`${BASE}/scheduled-reports`, data);
  return res.data;
}

export async function updateScheduledReport(id: number, data: ScheduleReportDTO): Promise<ScheduledReportDTO> {
  const res = await api.put(`${BASE}/scheduled-reports/${id}`, data);
  return res.data;
}

export async function deleteScheduledReport(id: number): Promise<void> {
  await api.delete(`${BASE}/scheduled-reports/${id}`);
}

// ==================== CONSTANTS ====================

export const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export const EXPORT_SECTION_OPTIONS: { value: ExportSection; label: string }[] = [
  { value: 'summary', label: 'Summary' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'methods', label: 'Payment Methods' },
  { value: 'doctors', label: 'Doctor Revenue' },
  { value: 'appointments', label: 'Appointment Types' },
  { value: 'refunds', label: 'Refunds' },
];

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  CONSULTATION: 'Consultation',
  FOLLOW_UP: 'Follow-up',
  EMERGENCY: 'Emergency',
  CHECKUP: 'Health Checkup',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  MOMO: 'MoMo',
  BANK_TRANSFER: 'Bank Transfer',
  VNPAY: 'VNPay',
  CREDIT_CARD: 'Credit Card',
};

export const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: '#10b981',
  MOMO: '#a855f7',
  BANK_TRANSFER: '#3b82f6',
  VNPAY: '#ef4444',
  CREDIT_CARD: '#f59e0b',
};

export const APPOINTMENT_TYPE_COLORS: Record<string, string> = {
  CONSULTATION: '#3b82f6',
  FOLLOW_UP: '#10b981',
  EMERGENCY: '#ef4444',
  CHECKUP: '#f59e0b',
};

// ==================== HELPERS ====================

export function formatCurrency(amount: number, currency = 'VND'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `₫${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `₫${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₫${(amount / 1_000).toFixed(0)}K`;
  return `₫${amount}`;
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function getDaysInRange(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function isRangeExcessive(startDate: string, endDate: string, maxMonths = 12): boolean {
  const days = getDaysInRange(startDate, endDate);
  return days > maxMonths * 30;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
