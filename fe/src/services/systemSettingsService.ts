import api from './api';

// ==================== TYPES ====================

export interface BusinessHour {
  day: string;
  openTime: string;
  closeTime: string;
  breakStart: string;
  breakEnd: string;
  closed: boolean;
}

export interface GeneralSettings {
  clinicName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  email: string;
  phone: string;
  fax: string;
  whatsapp: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  businessHours: BusinessHour[];
  timezone: string;
  language: string;
  dateFormat: string;
  timeFormat: string;
}

export interface AppointmentSettings {
  maxAdvanceBookingDays: number;
  defaultDurationMinutes: number;
  allowSameDayBooking: boolean;
  requireConfirmation: boolean;
  enableCancellationPolicy: boolean;
  cancellationDeadlineHours: number;
  cancellationFeeType: string;
  cancellationFeeAmount: number;
  cancellationApplyTo: string;
  enableReschedulingPolicy: boolean;
  maxReschedules: number;
  reschedulingDeadlineHours: number;
  noShowAfterMinutes: number;
  noShowFee: number;
  blockAfterNoShows: number;
  emailReminderEnabled: boolean;
  emailReminderHoursBefore: number;
  smsReminderEnabled: boolean;
  smsReminderHoursBefore: number;
  pushReminderEnabled: boolean;
  pushReminderHoursBefore: number;
}

export interface PaymentGateway {
  name: string;
  apiKey: string;
  secretKey: string;
  merchantId: string;
  testMode: boolean;
  enabled: boolean;
}

export interface PaymentSettings {
  cashEnabled: boolean;
  cardEnabled: boolean;
  bankTransferEnabled: boolean;
  insuranceEnabled: boolean;
  momoEnabled: boolean;
  zalopayEnabled: boolean;
  vnpayEnabled: boolean;
  gateways: PaymentGateway[];
  taxRate: number;
  transactionFeePayor: string;
  transactionFeePercent: number;
  currency: string;
  enableRefundPolicy: boolean;
  refundProcessingDays: number;
  refundToOriginalMethod: boolean;
  refundToBankTransfer: boolean;
  refundToCredit: boolean;
  allowPartialRefund: boolean;
  refundFeePercent: number;
  autoGenerateInvoice: boolean;
  invoicePrefix: string;
  invoiceNumberFormat: string;
  includeTaxOnInvoice: boolean;
  invoiceFooterText: string;
}

export interface NotificationSettings {
  emailProvider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpEncryption: string;
  emailApiKey: string;
  emailFromAddress: string;
  emailFromName: string;
  smsProvider: string;
  smsAccountSid: string;
  smsAuthToken: string;
  smsFromNumber: string;
  smsApiKey: string;
  pushEnabled: boolean;
  fcmServerKey: string;
  fcmProjectId: string;
  apnsCertificateUrl: string;
  apnsKeyId: string;
  apnsTeamId: string;
  emailNewUserRegistration: boolean;
  emailNewAppointment: boolean;
  emailPaymentReceived: boolean;
  emailSystemAlerts: boolean;
  emailDailyReport: boolean;
  smsAppointmentConfirmation: boolean;
  smsAppointmentReminder: boolean;
  smsPaymentConfirmation: boolean;
  pushNewAppointment: boolean;
  pushAppointmentReminder: boolean;
  pushPaymentReceived: boolean;
}

export interface SecuritySettings {
  minPasswordLength: number;
  passwordExpirationDays: number;
  passwordHistoryCount: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  enableRememberMe: boolean;
  forceLogoutOnPasswordChange: boolean;
  require2faForAdmins: boolean;
  require2faForDoctors: boolean;
  allow2faForPatients: boolean;
  enable2faAuthenticator: boolean;
  enable2faSms: boolean;
  enable2faEmail: boolean;
  enableAccountLockout: boolean;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  autoUnlockAfterDuration: boolean;
  enableRateLimiting: boolean;
  apiRateLimit: number;
  rateLimitScope: string;
  loginRateLimit: number;
  rateLimitAction: string;
  encryptSensitiveData: boolean;
  encryptBackups: boolean;
  forceHttps: boolean;
  enableHsts: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  responseTimeMs: number;
}

// ==================== API FUNCTIONS ====================

const BASE_PATH = '/admin/settings';

// General Settings
export const getGeneralSettings = () =>
  api.get<GeneralSettings>(`${BASE_PATH}/general`);

export const updateGeneralSettings = (data: GeneralSettings) =>
  api.put<GeneralSettings>(`${BASE_PATH}/general`, data);

// Appointment Settings
export const getAppointmentSettings = () =>
  api.get<AppointmentSettings>(`${BASE_PATH}/appointment`);

export const updateAppointmentSettings = (data: AppointmentSettings) =>
  api.put<AppointmentSettings>(`${BASE_PATH}/appointment`, data);

// Payment Settings
export const getPaymentSettings = () =>
  api.get<PaymentSettings>(`${BASE_PATH}/payment`);

export const updatePaymentSettings = (data: PaymentSettings) =>
  api.put<PaymentSettings>(`${BASE_PATH}/payment`, data);

export const testPaymentGateway = (gatewayName: string) =>
  api.post<TestConnectionResult>(`${BASE_PATH}/payment/test-gateway`, null, {
    params: { gatewayName },
  });

// Notification Settings
export const getNotificationSettings = () =>
  api.get<NotificationSettings>(`${BASE_PATH}/notification`);

export const updateNotificationSettings = (data: NotificationSettings) =>
  api.put<NotificationSettings>(`${BASE_PATH}/notification`, data);

export const testEmailConnection = () =>
  api.post<TestConnectionResult>(`${BASE_PATH}/notification/test-email`);

export const testSmsConnection = () =>
  api.post<TestConnectionResult>(`${BASE_PATH}/notification/test-sms`);

// Security Settings
export const getSecuritySettings = () =>
  api.get<SecuritySettings>(`${BASE_PATH}/security`);

export const updateSecuritySettings = (data: SecuritySettings) =>
  api.put<SecuritySettings>(`${BASE_PATH}/security`, data);
