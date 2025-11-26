"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  getCurrentUser,
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  User,
} from "../../features/auth/lib/auth-api";
import { getAccessToken } from "../../features/auth/lib/token-storage";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: {
    username?: string;
    email?: string;
    password: string;
  }) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }

      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to get current user:", error);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          await refreshUser();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [refreshUser]);

  const login = useCallback(
    async (data: { username?: string; email?: string; password: string }) => {
      const response = await loginApi(data);
      setUser(response.user);
    },
    [],
  );

  const register = useCallback(
    async (data: { username: string; email: string; password: string }) => {
      const response = await registerApi(data);
      setUser(response.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
