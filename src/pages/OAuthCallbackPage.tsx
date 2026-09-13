import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function OAuthCallbackPage() {
  const { completeOAuth } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const providerError = params.get("error_description") || params.get("error");
    const code = params.get("code");
    if (providerError || !code) {
      setError(providerError || "The provider didn't return a sign-in code.");
      return;
    }
    completeOAuth(code)
      .then((returnTo) => navigate(returnTo, { replace: true }))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Sign-in couldn't be completed."));
  }, [completeOAuth, navigate, params]);

  return (
    <section className="center-page">
      <div className="status-card">
        {error ? <><div className="status-icon error-icon">!</div><h1>Sign-in didn’t finish</h1><p>{error}</p><Link className="button" to="/login">Try again</Link></> : <><span className="spinner" /><h1>Finishing sign-in…</h1><p>This should only take a moment.</p></>}
      </div>
    </section>
  );
}
