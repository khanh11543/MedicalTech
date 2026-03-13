import api from "./api";

// Types matching backend DTOs
export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
}

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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
}

export interface MfaSetupResponse {
  twoFactorEnabled: boolean;
  issuer: string;
  accountName: string;
  otpauthUrl: string;
}

export interface MfaEnableResponse {
  twoFactorEnabled: boolean;
  backupCodes: string[];
}

export interface UserResponse {
  id: number;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}

export interface MessageResponse {
  message: string;
  success: boolean;
  timestamp: string;
}

const authService = {
  register: async (data: RegisterRequest): Promise<UserResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  verifyEmail: async (data: VerifyOtpRequest): Promise<MessageResponse> => {
    const response = await api.post("/auth/verify-email", data);
    return response.data;
  },

  resendOtp: async (email: string): Promise<MessageResponse> => {
    const response = await api.post("/auth/resend-otp", { email });
    return response.data;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  verifyMfaLogin: async (data: MfaVerifyLoginRequest): Promise<TokenResponse> => {
    const response = await api.post("/auth/mfa/verify-login", data);
    return response.data;
  },

  // Authenticator MFA (Patient)
  mfaSetup: async (): Promise<MfaSetupResponse> => {
    const response = await api.post("/me/mfa/setup");
    return response.data;
  },

  mfaEnable: async (code: string): Promise<MfaEnableResponse> => {
    const response = await api.post("/me/mfa/enable", { code });
    return response.data;
  },

  mfaDisable: async (code: string): Promise<MessageResponse> => {
    const response = await api.post("/me/mfa/disable", { code });
    return response.data;
  },

  logout: async (): Promise<MessageResponse> => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<MessageResponse> => {
    const response = await api.post("/auth/forgot-password", data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<MessageResponse> => {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<MessageResponse> => {
    const response = await api.post("/auth/change-password", data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await api.post("/auth/refresh", { refreshToken });
    return response.data;
  },

  verifyAccount: async (token: string): Promise<MessageResponse> => {
    const response = await api.get(`/auth/verify-account?token=${encodeURIComponent(token)}`);
    return response.data;
  },
};

export default authService;
