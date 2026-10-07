"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ApiError, DENIED_KEY, TOKEN_KEY, api } from "./api";
import { isAdminRole } from "./format";
import type { AuthSession, UserProfile } from "./types";

export const STAFF_ONLY = "This portal is for staff. That sign-in is a customer account, so it was not kept.";

const tokenListeners = new Set<() => void>();

function subscribeToken(listener: () => void) {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

function notifyToken() {
  tokenListeners.forEach((listener) => listener());
}

function readToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  notifyToken();
}

function getServerToken() {
  return null;
}

function rememberDenial(message: string) {
  sessionStorage.setItem(DENIED_KEY, message);
}

type AuthContextValue = {
  user: UserProfile | null;
  ready: boolean;
  profileError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function sessionUser(session: AuthSession): UserProfile {
  return {
    id: session.userId,
    name: session.name,
    email: session.email,
    phone: "",
    role: session.role,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeToken, readToken, getServerToken);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const ready = !token || user !== null || checked;

  const rejectStaff = useCallback((message: string) => {
    setStoredToken(null);
    setUser(null);
    setProfileError(null);
    rememberDenial(message);
  }, []);

  const refresh = useCallback(async () => {
    const current = readToken();
    if (!current) {
      setUser(null);
      setProfileError(null);
      setChecked(true);
      return;
    }

    try {
      const profile = await api<UserProfile>("/api/auth/me");
      if (!isAdminRole(profile.role)) {
        rejectStaff(STAFF_ONLY);
        return;
      }
      setUser(profile);
      setProfileError(null);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setStoredToken(null);
        setUser(null);
        setProfileError(null);
        return;
      }
      setProfileError(error instanceof Error ? error.message : "Could not confirm this staff session.");
    } finally {
      setChecked(true);
    }
  }, [rejectStaff]);

  useEffect(() => {
    if (!token || user) return;
    let cancelled = false;
    api<UserProfile>("/api/auth/me")
      .then((profile) => {
        if (cancelled) return;
        if (!isAdminRole(profile.role)) {
          rejectStaff(STAFF_ONLY);
          return;
        }
        setUser(profile);
        setProfileError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setStoredToken(null);
          setUser(null);
          setProfileError(null);
          return;
        }
        setProfileError(error instanceof Error ? error.message : "Could not confirm this staff session.");
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token, user, rejectStaff]);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await api<AuthSession>("/api/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password }),
      });
      if (!isAdminRole(session.role)) {
        throw new Error(STAFF_ONLY);
      }
      setStoredToken(session.token);
      setUser(sessionUser(session));
      setProfileError(null);
      setChecked(true);
      try {
        const profile = await api<UserProfile>("/api/auth/me");
        if (!isAdminRole(profile.role)) {
          setStoredToken(null);
          setUser(null);
          throw new Error(STAFF_ONLY);
        }
        setUser(profile);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setStoredToken(null);
          setUser(null);
        }
        throw error;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    setProfileError(null);
    setChecked(true);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, ready, profileError, login, logout, refresh }),
    [user, ready, profileError, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
