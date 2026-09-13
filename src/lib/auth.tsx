import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AuthResult, MfaState, Provider, User } from "../types";
import { finishOAuth, oauthRedirectUrl, startOAuth } from "./oauth";
import { API_BASE, ApiError, publicRequest } from "./request";

const SESSION_KEY = "kemit_web_session";

type SignupResult = { status: "confirmation_required"; email: string; message: string } | ({ status: "signed_in" } & AuthResult);

type AuthContextValue = {
  auth: AuthResult | null;
  ready: boolean;
  login(email: string, password: string): Promise<AuthResult>;
  signup(email: string, password: string, displayName?: string): Promise<SignupResult>;
  beginOAuth(provider: Provider, returnTo?: string): Promise<void>;
  completeOAuth(code: string): Promise<string>;
  verifyMfa(input: { code?: string; recoveryCode?: string }): Promise<MfaState>;
  request<T>(path: string, options?: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown }): Promise<T>;
  logout(scope?: "local" | "global"): Promise<void>;
  clear(): void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function shouldRefreshAfter(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401 && (error.code === "INVALID_TOKEN" || error.code === "NO_TOKEN");
}

function readSession(): AuthResult | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthResult) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthResult | null>(readSession);
  const [ready, setReady] = useState(false);
  const authRef = useRef(auth);
  const refreshRef = useRef<Promise<AuthResult> | null>(null);

  const setAuth = useCallback((next: AuthResult | null) => {
    authRef.current = next;
    setAuthState(next);
    if (next) sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const refresh = useCallback(async () => {
    if (refreshRef.current) return refreshRef.current;
    const refreshToken = authRef.current?.session.refreshToken;
    if (!refreshToken) throw new ApiError("Your session ended. Sign in again.", 401, "NO_SESSION");
    refreshRef.current = publicRequest<AuthResult>(API_BASE, "/auth/refresh", { method: "POST", body: { refreshToken } })
      .then((next) => {
        setAuth(next);
        return next;
      })
      .catch((error) => {
        setAuth(null);
        throw error;
      })
      .finally(() => {
        refreshRef.current = null;
      });
    return refreshRef.current;
  }, [setAuth]);

  useEffect(() => {
    const current = authRef.current;
    if (!current) {
      setReady(true);
      return;
    }
    const expiresSoon = current.session.expiresAt * 1000 <= Date.now() + 60_000;
    (expiresSoon ? refresh() : Promise.resolve(current)).finally(() => setReady(true));
  }, [refresh]);

  const request = useCallback(
    async <T,>(path: string, options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {}) => {
      let current = authRef.current;
      if (!current) throw new ApiError("Sign in to continue.", 401, "NO_SESSION");
      if (current.session.expiresAt * 1000 <= Date.now() + 60_000) current = await refresh();
      try {
        return await publicRequest<T>(API_BASE, path, { ...options, token: current.session.accessToken });
      } catch (error) {
        if (!shouldRefreshAfter(error)) {
          if (error instanceof ApiError && error.code === "SESSION_REVOKED") setAuth(null);
          throw error;
        }
        current = await refresh();
        return publicRequest<T>(API_BASE, path, { ...options, token: current.session.accessToken });
      }
    },
    [refresh, setAuth]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await publicRequest<AuthResult>(API_BASE, "/auth/login", { method: "POST", body: { email, password } });
      setAuth(result);
      return result;
    },
    [setAuth]
  );

  const signup = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const result = await publicRequest<SignupResult>(API_BASE, "/auth/signup", {
        method: "POST",
        body: { email, password, ...(displayName?.trim() ? { displayName: displayName.trim() } : {}) },
      });
      if (result.status === "signed_in") setAuth(result);
      return result;
    },
    [setAuth]
  );

  const beginOAuth = useCallback(async (provider: Provider, returnTo = "/account") => {
    const url = await startOAuth(provider, { apiBase: API_BASE, redirectTo: oauthRedirectUrl(), returnTo });
    window.location.assign(url);
  }, []);

  const completeOAuth = useCallback(
    async (code: string) => {
      const result = await finishOAuth(code, { apiBase: API_BASE });
      setAuth(result.auth);
      return result.returnTo;
    },
    [setAuth]
  );

  const verifyMfa = useCallback(
    async (input: { code?: string; recoveryCode?: string }) => {
      const result = await request<{ mfa: MfaState }>("/auth/mfa/verify", { method: "POST", body: input });
      if (authRef.current) setAuth({ ...authRef.current, mfa: result.mfa });
      return result.mfa;
    },
    [request, setAuth]
  );

  const logout = useCallback(
    async (scope: "local" | "global" = "local") => {
      const token = authRef.current?.session.accessToken;
      setAuth(null);
      if (token) await publicRequest<void>(API_BASE, "/auth/logout", { method: "POST", body: { scope }, token }).catch(() => undefined);
    },
    [setAuth]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ auth, ready, login, signup, beginOAuth, completeOAuth, verifyMfa, request, logout, clear: () => setAuth(null) }),
    [auth, ready, login, signup, beginOAuth, completeOAuth, verifyMfa, request, logout, setAuth]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function displayName(user: User | null | undefined): string {
  return user?.displayName || user?.email?.split("@")[0] || "there";
}
