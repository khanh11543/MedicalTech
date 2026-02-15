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

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post("/auth/login", data);
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
};

export default authService;
