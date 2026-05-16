import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login } from "./api";
import type { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  isReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const rawUser = localStorage.getItem("smart-security-user");
    if (rawUser) {
      setUser(JSON.parse(rawUser));
    }
    setIsReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      async signIn(email: string, password: string) {
        const result = await login(email, password);
        localStorage.setItem("smart-security-token", result.token);
        localStorage.setItem("smart-security-user", JSON.stringify(result.user));
        setUser(result.user);
      },
      signOut() {
        localStorage.removeItem("smart-security-token");
        localStorage.removeItem("smart-security-user");
        setUser(null);
      },
    }),
    [isReady, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
