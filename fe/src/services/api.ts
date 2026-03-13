import axios from "axios";
import { authStorage } from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh queue
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// Response interceptor: handle 401, Network Errors, and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip interceptor for auth endpoints (login, register, etc.) — let errors propagate directly
    const requestUrl = originalRequest?.url || "";
    const isAuthEndpoint =
      requestUrl.startsWith("/auth/") ||
      requestUrl === "/auth";

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Detect auth failure: either explicit 401 or "Network Error" (CORS-blocked 401/403)
    const isAuthError =
      error.response?.status === 401 ||
      (!error.response && error.message === "Network Error" && authStorage.getAccessToken());

    if (isAuthError && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Another refresh is already in progress — wait for it
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      const refreshToken = authStorage.getRefreshToken();
      if (!refreshToken) {
        authStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(error);
      }

      isRefreshing = true;
      try {
        const response = await api.post("/auth/refresh", { refreshToken });
        const accessToken = response.data.accessToken;
        authStorage.setTokens(accessToken, refreshToken);
        onTokenRefreshed(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear tokens and redirect to login
        authStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
