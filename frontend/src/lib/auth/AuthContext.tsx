"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserRole, getDefaultRouteForRole, ROLE_CONFIGS } from "./rbac";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  plan: "Starter" | "Professional" | "Enterprise";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, role?: UserRole, orgName?: string) => Promise<{ success: boolean; redirectUrl: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  switchRole: (newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: "usr_demo_101",
  name: "Alex Sterling",
  email: "alex@metrologistics.com",
  role: "fleet_manager",
  organizationId: "org_metro_global",
  organizationName: "Metro Fleet Logistics Ltd",
  plan: "Professional",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("fi360_auth_token");
      const storedUser = localStorage.getItem("fi360_auth_user");
      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        // Normalize role if legacy format was stored
        const validRoles: UserRole[] = [
          "owner", "admin", "fleet_manager", "workshop_manager",
          "technician", "driver", "dispatcher", "compliance", "finance", "viewer"
        ];
        if (!validRoles.includes(parsed.role)) {
          parsed.role = "fleet_manager";
        }
        setToken(storedToken);
        setUser(parsed);
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    role: UserRole = "fleet_manager",
    orgName: string = "Metro Fleet Logistics Ltd"
  ): Promise<{ success: boolean; redirectUrl: string }> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const authUser: User = {
      ...DEMO_USER,
      email,
      name:
        email.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
        ROLE_CONFIGS[role].label,
      role,
      organizationName: orgName,
    };

    const dummyToken = `jwt_${Date.now()}_fi360`;

    setUser(authUser);
    setToken(dummyToken);

    localStorage.setItem("fi360_auth_token", dummyToken);
    localStorage.setItem("fi360_auth_user", JSON.stringify(authUser));

    setIsLoading(false);
    const redirectUrl = getDefaultRouteForRole(role);
    return { success: true, redirectUrl };
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updatedUser = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem("fi360_auth_user", JSON.stringify(updatedUser));
    const target = getDefaultRouteForRole(newRole);
    router.push(target);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("fi360_auth_token");
    localStorage.removeItem("fi360_auth_user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        switchRole,
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
