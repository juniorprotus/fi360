"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserRole, getDefaultRouteForRole } from "./rbac";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  plan?: "Starter" | "Professional" | "Enterprise";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; user: User; redirectUrl: string }>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }) => Promise<{ success: boolean; user: User; redirectUrl: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE: string = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  if (process.env.NODE_ENV === 'development') {
    return 'http://127.0.0.1:5000';
  }
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set. Please configure the API base URL.');
})();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  /**
   * Verified session rehydration:
   * Contacts backend /api/auth/me to verify token authenticity and active account status.
   * Never treats browser localStorage as authoritative.
   */
  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE!}/api/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        localStorage.removeItem("fi360_auth_token");
        localStorage.removeItem("fi360_auth_user");
        setUser(null);
        return;
      }

      const data = await res.json();
      if (data.success && data.user) {
        const verifiedUser: User = {
          id: data.user.userId,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          organizationId: data.user.organizationId,
          organizationName: data.user.organizationName,
          plan: data.user.plan || "Professional",
        };
        setUser(verifiedUser);
      } else {
        throw new Error("Invalid session verification payload");
      }
    } catch {
      localStorage.removeItem("fi360_auth_token");
      localStorage.removeItem("fi360_auth_user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  /**
   * Production login:
   * Sends credentials to backend /api/auth/login.
   * Rejects on any 401/400.
   */
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; user: User; redirectUrl: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE!}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FI360-Request": "1",
        },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid email or password");
      }

      const authenticatedUser: User = {
        id: data.user.userId,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        organizationId: data.user.organizationId,
        organizationName: data.user.organizationName,
        plan: data.user.plan || "Professional",
      };

      setUser(authenticatedUser);

      const redirectUrl =
        data.redirectUrl || getDefaultRouteForRole(authenticatedUser.role);

      return { success: true, user: authenticatedUser, redirectUrl };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Customer account registration:
   * Dispatches to /api/auth/register.
   */
  const register = async (data: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }): Promise<{ success: boolean; user: User; redirectUrl: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE!}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FI360-Request": "1",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.message || "Registration failed. Please check inputs.");
      }

      const newUser: User = {
        id: resData.user.userId,
        name: resData.user.name,
        email: resData.user.email,
        role: resData.user.role,
        organizationId: resData.user.organizationId,
        organizationName: resData.user.organizationName,
        plan: "Professional",
      };

      setUser(newUser);

      return {
        success: true,
        user: newUser,
        redirectUrl: resData.redirectUrl || "/dashboard",
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Session termination:
   * Invalidates server cookie and clears client credentials.
   */
  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { "X-FI360-Request": "1" },
        credentials: "include",
      });
    } catch {
      // Ignored: continue client cleanup
    } finally {
      localStorage.removeItem("fi360_auth_token");
      localStorage.removeItem("fi360_auth_user");
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
