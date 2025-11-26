import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "@/features/auth/lib/token-storage";
import { refreshToken } from "@/features/auth/lib/auth-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// 创建 axios 实例
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 是否正在刷新 token
let isRefreshing = false;
// 待重试的请求队列
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// 处理队列中的请求
const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// 请求拦截器：自动添加 Access Token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 响应拦截器：处理 token 刷新
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 如果是 401 错误且错误码是 TOKEN_EXPIRED，尝试刷新 token
    if (
      error.response?.status === 401 &&
      (error.response.data as { code?: string })?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // 如果正在刷新，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshTokenValue = getRefreshToken();
        if (!refreshTokenValue) {
          throw new Error("No refresh token available");
        }

        const { accessToken, refreshToken: newRefreshToken } =
          await refreshToken();
        saveTokens(accessToken, newRefreshToken);

        processQueue(null, accessToken);

        // 重试原始请求
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        clearTokens();
        // 跳转到登录页
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 如果是其他 401 错误（如 NO_TOKEN），清除 tokens 并跳转登录
    if (
      error.response?.status === 401 &&
      (error.response.data as { code?: string })?.code === "NO_TOKEN"
    ) {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
