import { apiFetch } from '@/services/apiClient';

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  trustedDeviceToken?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  refreshExpiresAt: string;
  sessionKey: string;
  userId: number;
  email: string;
  roles: string[];
  trustedDeviceToken?: string;
}

export interface LoginResponse {
  mfaRequired: boolean;
  mfaToken?: string;
  mfaExpiresAt?: string;
  token?: TokenResponse;
}

export interface MfaVerifyLoginRequest {
  mfaToken: string;
  code: string;
  rememberDevice?: boolean;
  deviceId?: string;
}

export interface MessageResponse {
  message: string;
  success: boolean;
  timestamp: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserResponse {
  id: number;
  email: string;
  phone: string | null;
  isVerified: boolean;
  roles: string[];
}

export const authApi = {
  register: (data: RegisterRequest) =>
    apiFetch<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  verifyEmail: (data: VerifyOtpRequest) =>
    apiFetch<MessageResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  resendOtp: (email: string) =>
    apiFetch<MessageResponse>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),

  login: (data: LoginRequest) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  verifyMfaLogin: (data: MfaVerifyLoginRequest) =>
    apiFetch<TokenResponse>('/auth/mfa/verify-login', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }),

  forgotPassword: (email: string) =>
    apiFetch<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),

  logout: () =>
    apiFetch<MessageResponse>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  changePassword: (data: ChangePasswordRequest) =>
    apiFetch<MessageResponse>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
