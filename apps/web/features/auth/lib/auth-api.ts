import { apiClient } from "@/lib/axios";
import { saveTokens, clearTokens, getRefreshToken } from "./token-storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  username?: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    name: string;
    image: string | null;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  image: string | null;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(`/auth/register`, data);
  saveTokens(response.data.accessToken, response.data.refreshToken);
  return response.data;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(`/auth/login`, data);
  saveTokens(response.data.accessToken, response.data.refreshToken);
  return response.data;
}

export async function refreshToken(): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const token = getRefreshToken();
  if (!token) {
    throw new Error("No refresh token available");
  }

  // 使用原生 axios 避免拦截器循环
  const axios = (await import("axios")).default;
  const response = await axios.post<{
    accessToken: string;
    refreshToken: string;
  }>(`${API_BASE_URL}/auth/refresh`, {
    refreshToken: token,
  });

  saveTokens(response.data.accessToken, response.data.refreshToken);
  return response.data;
}

export async function logout(): Promise<void> {
  const token = getRefreshToken();
  if (token) {
    try {
      await apiClient.post(`/auth/logout`, {
        refreshToken: token,
      });
    } catch (error) {
      // Ignore errors on logout
      console.error("Logout error:", error);
    }
  }
  clearTokens();
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<{ user: User }>(`/auth/me`);
  return response.data.user;
}

export async function updateUserAvatar(imageUrl: string): Promise<User> {
  const response = await apiClient.put<{ user: User }>(`/auth/profile`, {
    image: imageUrl,
  });
  return response.data.user;
}
