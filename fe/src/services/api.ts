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

// Refresh token mutex — prevents concurrent refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers = [];
}

// Response interceptor: handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Skip refresh for auth endpoints themselves
    if (originalRequest.url?.includes("/auth/refresh") || originalRequest.url?.includes("/auth/login")) {
      return Promise.reject(error);
    }

    // Attempt token refresh on 401 (unauthenticated / expired token)
    if ((status === 401 || status === 403) && !originalRequest._retry) {
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
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        authStorage.setTokens(accessToken, newRefreshToken);

        isRefreshing = false;
        onTokenRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        isRefreshing = false;
        onRefreshFailed();
        // Refresh failed — clear tokens and redirect to login
        authStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
