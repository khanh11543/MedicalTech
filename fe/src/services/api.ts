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

// Response interceptor: handle 401, Network Errors, and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

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
      (!error.response && error.message === "Network Error" && localStorage.getItem("accessToken"));

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
        return Promise.reject(error);
      }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — clear tokens and redirect to login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/signin";
          return Promise.reject(error);
        }
      } else {
        // No refresh token available — redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/signin";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
