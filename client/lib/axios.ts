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
// REQUEST — attach access token
// ─────────────────────────────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE — silent refresh + error mapping
// ─────────────────────────────────────────────────────────────────────────────

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<BackendErrorResponse>) => {
    const config = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    const isAuthEndpoint =
      config?.url?.includes("/auth/refresh") ||
      config?.url?.includes("/auth/login") ||
      config?.url?.includes("/auth/2fa/verify") ||
      config?.url?.includes("/auth/2fa/backup");

    // ── 401 → try silent refresh ────────────────────────────────────────────
    if (status === 401 && config && !config._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request while refresh is in-flight
        return new Promise((resolve, reject) => {
          refreshQueue.push((newToken: string) => {
            if (!newToken) {
              reject(toApiError(error));
              return;
            }
            config.headers.Authorization = `Bearer ${newToken}`;
            resolve(apiClient(config));
          });
        });
      }

      config._retry = true;
      isRefreshing = true;

      try {
        // Cookie is sent automatically — no body needed
        const { data } = await apiClient.post<{
          access_token: string;
          user: unknown;
        }>("/auth/refresh");
        const newToken = data.access_token;

        useAuthStore.getState().setAccessToken(newToken);
        flushQueue(newToken);

        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      } catch {
        clearQueueWithError();
        useAuthStore.getState().clearAuth();
        window.location.replace("/auth/login");
        return Promise.reject(toApiError(error));
      } finally {
        isRefreshing = false;
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
