import { KeyRound, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { returnPathFromState } from "../lib/returnTo";

export function MfaPage() {
  const { auth, verifyMfa, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = returnPathFromState(location.state);
  const [value, setValue] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!auth) return <Navigate to="/login" replace />;
  if (!auth.mfa?.required) return <Navigate to={from || "/account"} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await verifyMfa(recovery ? { recoveryCode: value } : { code: value.replace(/\s/g, "") });
      navigate(from || "/account", { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That code couldn't be verified.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="center-page">
      <form className="status-card verify-card" onSubmit={submit}>
        <div className="status-icon"><ShieldCheck /></div>
        <h1>One more step</h1>
        <p>{recovery ? "Enter one of your unused recovery codes." : "Enter the 6-digit code from your authenticator app."}</p>
        <div className="input-wrap"><KeyRound /><input required autoFocus inputMode={recovery ? "text" : "numeric"} autoComplete="one-time-code" value={value} onChange={(event) => setValue(event.target.value)} placeholder={recovery ? "ABCDE-FGHIJ" : "123 456"} /></div>
        {error && <div className="message error" role="alert">{error}</div>}
        <button className="button button-wide" disabled={busy}>{busy ? "Checking…" : "Verify and continue"}</button>
        <button className="text-button" type="button" onClick={() => { setRecovery((current) => !current); setValue(""); setError(""); }}>{recovery ? "Use authenticator code" : "Use a recovery code"}</button>
        <button className="text-button muted" type="button" onClick={() => void logout().then(() => navigate("/login", { state: { from } }))}>Sign in with another account</button>
      </form>
    </section>
  );
}
