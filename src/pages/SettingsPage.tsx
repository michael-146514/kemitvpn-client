import { LogOut, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardPage, useDashboard } from "../components/DashboardLayout";
import { useAuth } from "../lib/auth";
import type { User } from "../types";

export function SettingsPage() {
  const { account, error: dashboardError, loading, refresh, updateAccount } = useDashboard();
  const { request, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(account?.user.displayName || "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { setName(account?.user.displayName || ""); }, [account?.user.displayName]);

  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy("save"); setError("");
    try {
      const result = await request<{ user: User }>("/me", { method: "PATCH", body: { displayName: name.trim() || null } });
      updateAccount((current) => ({ ...current, user: result.user }));
      setNotice("Your profile was updated.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your profile couldn't be updated."); }
    finally { setBusy(""); }
  };

  if (loading) return <div className="dashboard-loader"><span className="spinner" />Loading settings…</div>;
  if (!account) return <div className="dashboard-empty"><ShieldCheck /><h2>We couldn’t load your settings</h2><p>{dashboardError}</p><button className="button" onClick={() => void refresh()}>Try again</button></div>;
  return (
    <DashboardPage eyebrow="Account" title="Settings" description="Keep your profile and account access up to date.">
      {error && <div className="message error dashboard-message">{error}</div>}
      {notice && <div className="message success dashboard-message">{notice}</div>}
      <div className="settings-grid">
        <article className="account-card settings-card"><div className="card-title"><span className="card-icon"><UserRound /></span><span><small>PROFILE</small><h2>Personal details</h2></span></div><form onSubmit={save}><label><span>Display name</span><input maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label><label><span>Email</span><input value={account.user.email || ""} disabled /></label><p className="provider-line">Authentication: {account.user.providers.length ? account.user.providers.join(", ") : "email"}</p><button className="button" disabled={busy === "save"}><Save size={17} />{busy === "save" ? "Saving…" : "Save changes"}</button></form></article>
        <article className="account-card settings-card"><div className="card-title"><span className="card-icon"><ShieldCheck /></span><span><small>SESSIONS</small><h2>Account access</h2></span></div><p className="settings-copy">If you’re concerned about your account, sign out every browser and device. You’ll need to sign in again here.</p><button className="button button-quiet danger-button" disabled={busy === "logout"} onClick={() => { setBusy("logout"); void logout("global").then(() => navigate("/")); }}><LogOut size={17} />Sign out everywhere</button></article>
      </div>
    </DashboardPage>
  );
}
