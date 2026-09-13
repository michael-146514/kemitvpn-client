import type { AuthResult, Provider } from "../types";
import { publicRequest } from "./request";
import { safeReturnPath } from "./returnTo";

const PENDING_KEY = "kemit_web_oauth_pending";
const MAX_FLOW_AGE_MS = 10 * 60 * 1000;

type PendingOAuth = {
  provider: Provider;
  verifier: string;
  createdAt: number;
  returnTo: string;
};

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createPkce(): Promise<{ verifier: string; challenge: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64Url(bytes);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

export async function startOAuth(
  provider: Provider,
  options: { apiBase: string; redirectTo: string; returnTo?: string; storage?: Storage }
): Promise<string> {
  const storage = options.storage ?? sessionStorage;
  const { verifier, challenge } = await createPkce();
  const pending: PendingOAuth = {
    provider,
    verifier,
    createdAt: Date.now(),
    returnTo: safeReturnPath(options.returnTo) ?? "/account",
  };
  storage.setItem(PENDING_KEY, JSON.stringify(pending));

  try {
    const response = await publicRequest<{ url: string }>(options.apiBase, "/auth/oauth/start", {
      method: "POST",
      body: { provider, redirectTo: options.redirectTo, codeChallenge: challenge },
    });
    return response.url;
  } catch (error) {
    storage.removeItem(PENDING_KEY);
    throw error;
  }
}

export async function finishOAuth(
  code: string,
  options: { apiBase: string; storage?: Storage; now?: number }
): Promise<{ auth: AuthResult; returnTo: string }> {
  const storage = options.storage ?? sessionStorage;
  const raw = storage.getItem(PENDING_KEY);
  storage.removeItem(PENDING_KEY);
  if (!raw) throw new Error("This sign-in attempt is missing or was already used. Please start again.");

  let pending: PendingOAuth;
  try {
    pending = JSON.parse(raw) as PendingOAuth;
  } catch {
    throw new Error("This sign-in attempt is invalid. Please start again.");
  }
  const now = options.now ?? Date.now();
  if (!pending.verifier || now - pending.createdAt > MAX_FLOW_AGE_MS) {
    throw new Error("This sign-in attempt expired. Please start again.");
  }

  const auth = await publicRequest<AuthResult>(options.apiBase, "/auth/oauth/exchange", {
    method: "POST",
    body: { code, codeVerifier: pending.verifier },
  });
  return { auth, returnTo: safeReturnPath(pending.returnTo) ?? "/account" };
}

export function oauthRedirectUrl(): string {
  return (import.meta.env.VITE_OAUTH_REDIRECT_URL as string | undefined)?.trim() || `${window.location.origin}/auth/callback`;
}

export const oauthPendingKey = PENDING_KEY;
