import { CheckCircle2, Laptop, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { displayName, useAuth } from "../lib/auth";
import { API_BASE, ApiError, publicRequest } from "../lib/request";

/*
  "Sign in with KemitVPN" for the desktop and mobile apps.

  The app opens <API>/oauth/authorize, which checks the request and sends the
  browser here with the same query string. This page:
    1. asks the API which app is asking (and whether the request is valid)
    2. sends a signed-out visitor to /login (and /verify for 2FA), then back here
    3. once signed in, shows "Continue as …"; Continue asks the API for a
       one-time code and hands the browser to the app's return address

  The app then exchanges the code (with its PKCE verifier) for its own session,
  so this website never sees the app's tokens. See server_v2/src/routes/appOAuth.ts.
*/

type AuthorizeInfo = {
  client: { id: string; name: string };
  redirectUri: string;
  state: string | null;
};

type Props = {
  /** Leaves the website for the app. Injected in tests (jsdom can't navigate). */
  leave?: (url: string) => void;
};

const defaultLeave = (url: string) => window.location.assign(url);

export function OAuthAuthorizePage({ leave = defaultLeave }: Props) {
  const { auth, ready, request, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const here = `${location.pathname}${location.search}`;
  const params = new URLSearchParams(location.search);

  const [info, setInfo] = useState<AuthorizeInfo | null>(null);
  const [invalid, setInvalid] = useState("");
  const [busy, setBusy] = useState<"continue" | "cancel" | "switch" | null>(null);
  const [error, setError] = useState("");
  const [handedOff, setHandedOff] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    publicRequest<AuthorizeInfo>(API_BASE, `/oauth/authorize/info${location.search}`)
      .then((next) => {
        if (!cancelled) setInfo(next);
      })
      .catch((reason) => {
        if (!cancelled) setInvalid(reason instanceof Error ? reason.message : "This sign-in link can't be used.");
      });
    return () => {
      cancelled = true;
    };
  }, [location.search]);

  if (invalid) {
    return (
      <section className="center-page">
        <div className="status-card">
          <div className="status-icon error-icon">!</div>
          <h1>This sign-in link can’t be used</h1>
          <p>{invalid} Go back to the KemitVPN app and try signing in again.</p>
        </div>
      </section>
    );
  }

  if (!ready || !info) {
    return <div className="page-loader"><span className="spinner" />Checking the sign-in request…</div>;
  }

  if (!auth) return <Navigate to="/login" replace state={{ from: here }} />;
  if (auth.mfa?.required) return <Navigate to="/verify" replace state={{ from: here }} />;

  const isDesktop = info.client.id.includes("desktop");
  const AppIcon = isDesktop ? Laptop : Smartphone;

  const handOff = (url: string) => {
    setHandedOff(url);
    leave(url);
  };

  const continueToApp = async () => {
    setBusy("continue");
    setError("");
    try {
      const result = await request<{ redirectTo: string }>("/oauth/authorize", {
        method: "POST",
        body: {
          clientId: info.client.id,
          redirectUri: info.redirectUri,
          codeChallenge: params.get("code_challenge"),
          codeChallengeMethod: params.get("code_challenge_method") || "S256",
          state: info.state ?? undefined,
        },
      });
      handOff(result.redirectTo);
    } catch (reason) {
      if (reason instanceof ApiError && reason.code === "MFA_REQUIRED") {
        navigate("/verify", { state: { from: here } });
        return;
      }
      setError(reason instanceof Error ? reason.message : "We couldn't finish signing in to the app.");
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    setBusy("cancel");
    setError("");
    try {
      const result = await publicRequest<{ redirectTo: string }>(API_BASE, "/oauth/authorize/cancel", {
        method: "POST",
        body: { clientId: info.client.id, redirectUri: info.redirectUri, state: info.state ?? undefined },
      });
      handOff(result.redirectTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't return to the app.");
    } finally {
      setBusy(null);
    }
  };

  const switchAccount = async () => {
    setBusy("switch");
    await logout();
    navigate("/login", { replace: true, state: { from: here } });
  };

  if (handedOff) {
    return (
      <section className="center-page">
        <div className="status-card">
          <div className="status-icon"><CheckCircle2 /></div>
          <h1>Return to the app</h1>
          <p>{info.client.name} is finishing sign-in. If it didn’t open by itself, use the button below. You can close this tab afterwards.</p>
          <a className="button button-wide" href={handedOff}>Open {info.client.name}</a>
        </div>
      </section>
    );
  }

  return (
    <section className="center-page">
      <div className="status-card verify-card">
        <div className="status-icon"><AppIcon /></div>
        <h1>Sign in to {info.client.name}</h1>
        <p>
          Continue as <strong>{auth.user.email || displayName(auth.user)}</strong>. The app gets its own sign-in on your account, and you can sign it
          out any time from Devices.
        </p>
        {error && <div className="message error" role="alert">{error}</div>}
        <button className="button button-wide" disabled={Boolean(busy)} onClick={() => void continueToApp()}>
          {busy === "continue" ? "Opening the app…" : "Continue"}
        </button>
        <button className="text-button" disabled={Boolean(busy)} onClick={() => void switchAccount()}>
          Use a different account
        </button>
        <button className="text-button muted" disabled={Boolean(busy)} onClick={() => void cancel()}>
          Cancel
        </button>
      </div>
    </section>
  );
}
