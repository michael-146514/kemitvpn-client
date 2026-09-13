import { AlertCircle, ArrowRight, CheckCircle2, CircleHelp, Download, Laptop, MonitorSmartphone, RefreshCw, Shield, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardPage, useDashboard } from "../components/DashboardLayout";

function date(value: string | null | undefined) {
  if (!value) return "No expiration";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function AccountPage() {
  const { account, error, loading, refresh } = useDashboard();
  if (loading) return <div className="dashboard-loader"><span className="spinner" />Loading your dashboard…</div>;
  if (!account) return <div className="dashboard-empty"><AlertCircle /><h2>We couldn’t load your account</h2><p>{error}</p><button className="button" onClick={() => void refresh()}>Try again</button></div>;

  const active = account.subscription?.hasActiveSubscription;
  return (
    <DashboardPage eyebrow="Overview" title={`Welcome${account.user.displayName ? `, ${account.user.displayName.split(" ")[0]}` : ""}.`} description="Your plan, VPN access, and trusted devices in one place." actions={<button className="button button-quiet" onClick={() => void refresh()}><RefreshCw size={17} />Refresh</button>}>
      {error && <div className="message error dashboard-message">{error}</div>}
      {account.device?.status === "waiting" && <div className="limit-banner"><AlertCircle /><div><strong>This browser is waiting for a device slot.</strong><p>Sign out another device to continue.</p></div><Link to="/account/devices">Manage devices <ArrowRight /></Link></div>}

      <div className="overview-grid">
        <article className={`account-card plan-card ${active ? "active-plan" : ""}`}>
          <div className="card-title"><span className="card-icon"><Shield /></span><span><small>YOUR PLAN</small><h2>{account.subscription?.plan?.name || "No active plan"}</h2></span></div>
          <div className="plan-status">{active ? <><CheckCircle2 />Active</> : <><AlertCircle />Inactive</>}</div>
          {active ? <div className="plan-details"><div><small>Access through</small><strong>{date(account.subscription?.currentPeriodEnd)}</strong></div><div><small>Device allowance</small><strong>{account.subscription?.plan?.maxDevices || account.device?.limit || 5} devices</strong></div><div><small>VPN account</small><strong>{account.vpn.provisioned ? "Ready" : "Ready on first connection"}</strong></div></div> : <p className="empty-copy">Open the KemitVPN app to choose and activate your plan.</p>}
          <Link className="button button-wide" to="/account/subscription">Manage subscription <ArrowRight size={17} /></Link>
        </article>

        <div className="overview-side-cards">
          <Link className="quick-card" to="/account/devices"><span className="quick-icon"><MonitorSmartphone /></span><span><small>DEVICES</small><strong>{account.device?.activeDevices ?? 0} active</strong><p>Review and sign out devices.</p></span><ArrowRight /></Link>
          <Link className="quick-card" to="/account/support"><span className="quick-icon"><CircleHelp /></span><span><small>NEED HELP?</small><strong>Support center</strong><p>Troubleshoot or contact us.</p></span><ArrowRight /></Link>
        </div>
      </div>

      <article className="download-card" id="downloads">
        <div><span className="eyebrow">CONNECT ANYWHERE</span><h2>Take KemitVPN with you.</h2><p>Install a native app to create the secure VPN tunnel. This website keeps your account organized.</p></div>
        <div className="download-actions"><button className="store-button"><Smartphone /><span><small>Download for</small>iPhone & iPad</span></button><button className="store-button"><Laptop /><span><small>Download for</small>Desktop</span></button></div>
      </article>
    </DashboardPage>
  );
}
