import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPkce, finishOAuth, oauthPendingKey, startOAuth } from "./oauth";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

const response = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

afterEach(() => vi.unstubAllGlobals());

describe("OAuth Authorization Code + PKCE", () => {
  it("creates an RFC 7636 S256 verifier and challenge", async () => {
    const { verifier, challenge } = await createPkce();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challenge).toBe(createHash("sha256").update(verifier).digest("base64url"));
  });

  it("starts through the KemitVPN backend and stores only the verifier locally", async () => {
    const storage = new MemoryStorage();
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => response({ url: "https://auth.example/authorize" }));
    vi.stubGlobal("fetch", fetchMock);

    const url = await startOAuth("apple", {
      apiBase: "https://vpn.example",
      redirectTo: "https://account.example/auth/callback",
      storage,
    });

    expect(url).toBe("https://auth.example/authorize");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [requestUrl, init] = fetchMock.mock.calls[0]!;
    expect(requestUrl).toBe("https://vpn.example/auth/oauth/start");
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body).toMatchObject({ provider: "apple", redirectTo: "https://account.example/auth/callback" });
    expect(body.codeChallenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const pending = JSON.parse(storage.getItem(oauthPendingKey)!);
    expect(pending.verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(storage.getItem(oauthPendingKey)).not.toContain(body.codeChallenge);
  });

  it("exchanges a callback code once and removes the verifier", async () => {
    const storage = new MemoryStorage();
    storage.setItem(oauthPendingKey, JSON.stringify({ provider: "apple", verifier: "v".repeat(43), createdAt: 1000, returnTo: "/account" }));
    const auth = {
      session: { accessToken: "access", refreshToken: "refresh", expiresAt: 2000, expiresIn: 3600, tokenType: "bearer" },
      user: { id: "u1", email: "a@example.com", displayName: null, status: "active", providers: ["apple"], emailConfirmed: true, createdAt: "2026-01-01" },
      device: null,
      mfa: { enabled: false, verified: false, required: false, methods: [] },
    };
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => response(auth));
    vi.stubGlobal("fetch", fetchMock);

    const result = await finishOAuth("one-time-code", { apiBase: "https://vpn.example", storage, now: 2000 });
    expect(result).toEqual({ auth, returnTo: "/account" });
    expect(storage.getItem(oauthPendingKey)).toBeNull();
    const body = JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body));
    expect(body).toEqual({ code: "one-time-code", codeVerifier: "v".repeat(43) });
    await expect(finishOAuth("one-time-code", { apiBase: "https://vpn.example", storage, now: 2000 })).rejects.toThrow(/missing|already used/i);
  });

  it("rejects an expired flow before calling the backend", async () => {
    const storage = new MemoryStorage();
    storage.setItem(oauthPendingKey, JSON.stringify({ provider: "google", verifier: "v".repeat(43), createdAt: 1, returnTo: "/account" }));
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.reject(new Error("should not be called")));
    vi.stubGlobal("fetch", fetchMock);
    await expect(finishOAuth("code", { apiBase: "https://vpn.example", storage, now: 10 * 60 * 1000 + 2 })).rejects.toThrow(/expired/i);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(storage.getItem(oauthPendingKey)).toBeNull();
  });

  it("clears the verifier when authorization cannot start", async () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("fetch", vi.fn((_url: string, _init?: RequestInit) => response({ code: "PROVIDER_DISABLED", message: "Provider disabled" }, 403)));
    await expect(startOAuth("google", { apiBase: "https://vpn.example", redirectTo: "https://account.example/auth/callback", storage })).rejects.toThrow("Provider disabled");
    expect(storage.getItem(oauthPendingKey)).toBeNull();
  });
});
