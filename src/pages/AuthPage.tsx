import { Apple, ArrowRight, Eye, EyeOff, KeyRound, Mail, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import type { Provider } from "../types";
import { useAuth } from "../lib/auth";
import { API_BASE, ApiError, publicRequest } from "../lib/request";
import { isAppSignIn, returnPathFromState } from "../lib/returnTo";

function GoogleMark() {
  return <span className="google-mark" aria-hidden="true">G</span>;
}

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { auth, login, signup, beginOAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [providers, setProviders] = useState<{ apple: boolean | null; google: boolean | null }>({ apple: null, google: null });
  const [providerError, setProviderError] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Set when an app (desktop / mobile) sent the user here to sign in.
  const from = returnPathFromState(location.state);
  const next = from || "/account";

  useEffect(() => {
    publicRequest<{ apple: boolean; google: boolean }>(API_BASE, "/auth/providers")
      .then(({ apple, google }) => { setProviders({ apple, google }); setProviderError(false); })
      .catch(() => setProviderError(true));
  }, []);

  if (auth && !auth.mfa?.required) return <Navigate to={next} replace />;
  if (auth?.mfa?.required) return <Navigate to="/verify" replace state={{ from }} />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy("email");
    try {
      if (mode === "login") {
        const result = await login(email, password);
        navigate(result.mfa?.required ? "/verify" : next, { replace: true, state: { from } });
      } else {
        const result = await signup(email, password, name);
        if (result.status === "confirmation_required") {
          setNotice(result.message);
          setPassword("");
        } else {
          navigate(result.mfa?.required ? "/verify" : next, { replace: true, state: { from } });
        }
      }
    } catch (reason) {
      setError(reason instanceof ApiError || reason instanceof Error ? reason.message : "Unable to continue.");
    } finally {
      setBusy(null);
    }
  };

  const social = async (provider: Provider) => {
    if (providers[provider] === false) {
      setError(`${provider === "apple" ? "Apple" : "Google"} sign-in is not enabled on the authentication server yet.`);
      return;
    }
    setBusy(provider);
    setError("");
    try {
      await beginOAuth(provider, next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Social sign-in couldn't start.");
      setBusy(null);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setError("Enter your email first, then choose Forgot password.");
      return;
    }
    setBusy("forgot");
    setError("");
    try {
      const response = await publicRequest<{ message: string }>(API_BASE, "/auth/password/forgot", { method: "POST", body: { email } });
      setNotice(response.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn't send the reset email.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="auth-layout">
      <div className="auth-aside">
        <span className="eyebrow">Your private account</span>
        <h1>{mode === "login" ? "Welcome back." : "Start with privacy."}</h1>
        <p>One simple account for your subscription, VPN access, and every device you trust.</p>
        <div className="mini-card"><KeyRound /><span><strong>Protected sign-in</strong><small>OAuth uses Authorization Code + PKCE. Your provider password never reaches KemitVPN.</small></span></div>
      </div>
      <div className="auth-card">
        <div className="auth-heading">
          <span>{mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</span>
          <h2>{mode === "login" ? "Good to see you" : "Join KemitVPN"}</h2>
          <p>{mode === "login" ? "Use your KemitVPN account to continue." : "It only takes a minute."}</p>
        </div>
        {isAppSignIn(from) && <div className="message success" role="status">Sign in to continue to the KemitVPN app.</div>}

        <div className="social-stack">
          <button className="social-button" disabled={Boolean(busy) || providers.apple === false} title={providers.apple === false ? "Enable Apple in Supabase Auth" : undefined} onClick={() => void social("apple")}><Apple size={20} />{busy === "apple" ? "Opening Apple…" : providers.apple === false ? "Apple sign-in unavailable" : "Continue with Apple"}</button>
          <button className="social-button" disabled={Boolean(busy) || providers.google === false} title={providers.google === false ? "Enable Google in Supabase Auth" : undefined} onClick={() => void social("google")}><GoogleMark />{busy === "google" ? "Opening Google…" : providers.google === false ? "Google setup required" : "Continue with Google"}</button>
        </div>
        {providerError && <div className="provider-warning">Social login status could not be checked. Confirm this website is allowed by the API’s CORS configuration.</div>}
        <div className="or"><span>or use email</span></div>

        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && <label><span>Name <small>optional</small></span><div className="input-wrap"><UserRound /><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Your name" /></div></label>}
          <label><span>Email</span><div className="input-wrap"><Mail /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div></label>
          <label><span>Password</span><div className="input-wrap"><KeyRound /><input required minLength={mode === "signup" ? 8 : 1} maxLength={128} type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
          {mode === "login" && <button type="button" className="text-button forgot" disabled={Boolean(busy)} onClick={() => void forgot()}>Forgot password?</button>}
          {error && <div className="message error" role="alert">{error}</div>}
          {notice && <div className="message success" role="status">{notice}</div>}
          <button className="button button-wide" disabled={Boolean(busy)}>{busy === "email" ? "Please wait…" : mode === "login" ? <>Sign in <ArrowRight size={18} /></> : <>Create account <ArrowRight size={18} /></>}</button>
        </form>
        <p className="auth-switch">{mode === "login" ? <>New to KemitVPN? <Link to="/signup" state={{ from }}>Create an account</Link></> : <>Already have an account? <Link to="/login" state={{ from }}>Sign in</Link></>}</p>
      </div>
    </section>
  );
}
