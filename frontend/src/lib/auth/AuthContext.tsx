"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Manager" | "Technician" | "Driver" | "Viewer";
  organizationId: string;
  organizationName: string;
  plan: "Starter" | "Professional" | "Enterprise";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, role?: User["role"], orgName?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: "usr_demo_101",
  name: "Alex Sterling",
  email: "alex@metrologistics.com",
  role: "Manager",
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
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to restore auth session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    role: User["role"] = "Manager",
    orgName: string = "Metro Fleet Logistics Ltd"
  ): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400)); // Simulating realistic handshake

    const authUser: User = {
      ...DEMO_USER,
      email,
      name: email.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Operator",
      role,
      organizationName: orgName,
    };

    const dummyToken = `jwt_${Date.now()}_fi360`;

    setUser(authUser);
    setToken(dummyToken);

    localStorage.setItem("fi360_auth_token", dummyToken);
    localStorage.setItem("fi360_auth_user", JSON.stringify(authUser));

    setIsLoading(false);
    return true;
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
