import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../lib/auth";
import { OAuthAuthorizePage } from "./OAuthAuthorizePage";

const QUERY =
  "?response_type=code&client_id=kemitvpn-desktop&redirect_uri=http%3A%2F%2F127.0.0.1%3A53682%2Foauth%2Fcallback&code_challenge=" +
  "a".repeat(43) +
  "&code_challenge_method=S256&state=st";

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

function signIn(mfaRequired = false) {
  sessionStorage.setItem(
    "kemit_web_session",
    JSON.stringify({
      session: { accessToken: "web-token", refreshToken: "web-refresh", expiresAt: Math.floor(Date.now() / 1000) + 3600, expiresIn: 3600, tokenType: "bearer" },
      user: { id: "u1", email: "mikie@example.com", displayName: null, status: "active", providers: ["email"], emailConfirmed: true, createdAt: "2026-09-13T00:00:00Z" },
      device: null,
      mfa: { enabled: mfaRequired, verified: !mfaRequired, required: mfaRequired, methods: [] },
    })
  );
}

function LoginProbe() {
  const location = useLocation();
  return <p>login page, back to {(location.state as { from?: string } | null)?.from}</p>;
}

function renderPage(leave = vi.fn()) {
  render(
    <MemoryRouter initialEntries={[`/oauth/authorize${QUERY}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/oauth/authorize" element={<OAuthAuthorizePage leave={leave} />} />
          <Route path="/login" element={<LoginProbe />} />
          <Route path="/verify" element={<p>verify page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
  return leave;
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());

describe("Sign in with KemitVPN (app authorize page)", () => {
  it("asks a signed-in user to continue, then hands the code to the app", async () => {
    signIn();
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url.includes("/oauth/authorize/info")) {
        return json({ client: { id: "kemitvpn-desktop", name: "KemitVPN for desktop" }, redirectUri: "http://127.0.0.1:53682/oauth/callback", state: "st" });
      }
      if (url.endsWith("/oauth/authorize") && init?.method === "POST") {
        return json({ redirectTo: "http://127.0.0.1:53682/oauth/callback?code=abc&state=st", expiresIn: 120 });
      }
      return json({ message: "unexpected" }, 500);
    });
    vi.stubGlobal("fetch", fetchMock);
    const leave = renderPage();

    expect(await screen.findByRole("heading", { name: "Sign in to KemitVPN for desktop" })).toBeVisible();
    expect(screen.getByText("mikie@example.com")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(leave).toHaveBeenCalledWith("http://127.0.0.1:53682/oauth/callback?code=abc&state=st");
    const post = fetchMock.mock.calls.find(([url, init]) => url.endsWith("/oauth/authorize") && init?.method === "POST")!;
    expect((post[1]!.headers as Record<string, string>).Authorization).toBe("Bearer web-token");
    expect(JSON.parse(post[1]!.body as string)).toEqual({
      clientId: "kemitvpn-desktop",
      redirectUri: "http://127.0.0.1:53682/oauth/callback",
      codeChallenge: "a".repeat(43),
      codeChallengeMethod: "S256",
      state: "st",
    });
    expect(await screen.findByRole("heading", { name: "Return to the app" })).toBeVisible();
  });

  it("sends a signed-out visitor to sign in and remembers where to come back", async () => {
    vi.stubGlobal("fetch", vi.fn(() => json({ client: { id: "kemitvpn-desktop", name: "KemitVPN for desktop" }, redirectUri: "http://127.0.0.1:53682/oauth/callback", state: "st" })));
    renderPage();
    expect(await screen.findByText(`login page, back to /oauth/authorize${QUERY}`)).toBeVisible();
  });

  it("finishes two-factor first", async () => {
    signIn(true);
    vi.stubGlobal("fetch", vi.fn(() => json({ client: { id: "kemitvpn-desktop", name: "KemitVPN for desktop" }, redirectUri: "http://127.0.0.1:53682/oauth/callback", state: "st" })));
    renderPage();
    expect(await screen.findByText("verify page")).toBeVisible();
  });

  it("explains a link the API rejects instead of redirecting anywhere", async () => {
    signIn();
    vi.stubGlobal("fetch", vi.fn(() => json({ message: "This app isn't allowed to use Sign in with KemitVPN.", code: "OAUTH_UNKNOWN_CLIENT" }, 400)));
    const leave = renderPage();
    expect(await screen.findByRole("heading", { name: "This sign-in link can’t be used" })).toBeVisible();
    expect(screen.getByText(/isn't allowed to use Sign in with KemitVPN/)).toBeVisible();
    expect(leave).not.toHaveBeenCalled();
  });

  it("returns a cancel to the app", async () => {
    signIn();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.includes("/cancel")
          ? json({ redirectTo: "http://127.0.0.1:53682/oauth/callback?error=access_denied&state=st" })
          : json({ client: { id: "kemitvpn-desktop", name: "KemitVPN for desktop" }, redirectUri: "http://127.0.0.1:53682/oauth/callback", state: "st" })
      )
    );
    const leave = renderPage();
    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(leave).toHaveBeenCalledWith("http://127.0.0.1:53682/oauth/callback?error=access_denied&state=st");
  });
});
