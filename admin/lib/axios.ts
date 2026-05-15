// ─────────────────────────────────────────────────────────────────────────────
// lib/axios.ts
// ─────────────────────────────────────────────────────────────────────────────

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/store/auth.store";
import { ApiError, type BackendErrorResponse } from "@/types/api.types";

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT
// ─────────────────────────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  withCredentials: true,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH LOGIC (SHARED)
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const flushQueue = (token: string) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

const clearQueueWithError = () => {
  refreshQueue.forEach((cb) => cb(""));
  refreshQueue = [];
};

const tryRefresh = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push((token) => resolve(token));
    });
  }

  isRefreshing = true;
  try {
    const { data } = await apiClient.post<{ access_token: string }>(
      "/auth/admin/refresh",
    );
    const newToken = data.access_token;
    useAuthStore.getState().setAccessToken(newToken);
    flushQueue(newToken);
    return newToken;
  } catch (error) {
    clearQueueWithError();
    useAuthStore.getState().clearAuth();
    // Redirect to admin login
    if (!window.location.pathname.startsWith("/auth")) {
      window.location.replace("/auth/login");
    }
    return "";
  } finally {
    isRefreshing = false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST — attach access token + pre-emptive refresh
// ─────────────────────────────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authPaths = [
      "/auth/admin/login",
      "/auth/admin/verify",
      "/auth/admin/refresh",
      "/auth/admin/forgot-password",
      "/auth/admin/reset-password",
      "/auth/admin/forgot-master-key",
      "/auth/admin/reset-master-key",
    ];

    const isAuthEndpoint = authPaths.some((path) => config.url?.includes(path));

    let token = useAuthStore.getState().accessToken;

    // ── Pre-emptive Refresh ─────────────────────────────────────────────────
    if (!token && !isAuthEndpoint) {
      token = await tryRefresh();
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE — silent refresh (as fallback) + error mapping
// ─────────────────────────────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<BackendErrorResponse>) => {
    const config = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;

    // If 401 and not already retried, try one last refresh
    if (status === 401 && config && !config._retry) {
      config._retry = true;
      const newToken = await tryRefresh();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      }
    }

    return Promise.reject(toApiError(error));
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// ERROR MAPPING
// Backend: { success: false, error: { code, message, fields? } }
// ─────────────────────────────────────────────────────────────────────────────

function toApiError(error: AxiosError<BackendErrorResponse>): ApiError {
  const status = error.response?.status ?? 0;
  const body = error.response?.data;

  if (!body) {
    return new ApiError(
      error.message || "Network error — please check your connection",
      status,
      0,
    );
  }

  if (body.success === false && body.error) {
    return new ApiError(
      body.error.message || "An error occurred",
      status,
      body.error.code,
      body.error.fields ?? null,
    );
  }

  return new ApiError("An unexpected error occurred", status, 0);
}

export { apiClient };
