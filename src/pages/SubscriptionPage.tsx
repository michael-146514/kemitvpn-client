import type { ReactNode } from "react";
import { AlertCircle, Apple, CalendarDays, CheckCircle2, CreditCard, ExternalLink, Gift, RefreshCw, Smartphone } from "lucide-react";
import { DashboardPage, useDashboard } from "../components/DashboardLayout";

type ProviderView = { name: string; description: string; icon: ReactNode; manageUrl?: string };

export function subscriptionProviderView(source: string | undefined): ProviderView {
  switch (source?.toLowerCase()) {
    case "apple": return { name: "Apple App Store", description: "Subscription and billing are managed by Apple.", icon: <Apple />, manageUrl: "https://apps.apple.com/account/subscriptions" };
    case "google": return { name: "Google Play", description: "Subscription and billing are managed through Google Play.", icon: <span className="provider-letter google">G</span>, manageUrl: "https://play.google.com/store/account/subscriptions" };
    case "stripe": return { name: "Stripe", description: "Subscription and billing are managed securely through Stripe.", icon: <span className="provider-letter stripe">S</span> };
    case "admin": return { name: "Complimentary access", description: "This subscription was granted directly by KemitVPN.", icon: <Gift /> };
    default: return { name: "No billing provider", description: "Activate a plan in the KemitVPN app to get started.", icon: <CreditCard /> };
  }
}

function date(value: string | null | undefined) {
  if (!value) return "No expiration";
  return new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function SubscriptionPage() {
  const { account, loading, error, refresh } = useDashboard();
  if (loading) return <div className="dashboard-loader"><span className="spinner" />Loading subscription…</div>;
  if (!account) return <div className="dashboard-empty"><AlertCircle /><h2>We couldn’t load your subscription</h2><p>{error}</p><button className="button" onClick={() => void refresh()}>Try again</button></div>;

  const subscription = account.subscription;
  const active = subscription?.hasActiveSubscription;
  const source = subscription?.source?.toLowerCase();
  const billing = subscriptionProviderView(source);
  return (
    <DashboardPage eyebrow="Billing" title="Subscription" description="Review your plan, access period, and where your billing is managed." actions={<button className="button button-quiet" onClick={() => void refresh()}><RefreshCw size={17} />Refresh</button>}>
      <div className="subscription-grid">
        <article className={`account-card subscription-hero ${active ? "active" : ""}`}>
          <div className="subscription-status-row"><span className="card-icon"><CreditCard /></span><span className={`subscription-badge ${active ? "active" : "inactive"}`}>{active ? <CheckCircle2 /> : <AlertCircle />}{active ? "Active" : "Inactive"}</span></div>
          <span className="subscription-kicker">CURRENT PLAN</span>
          <h2>{subscription?.plan?.name || "No active plan"}</h2>
          <p>{active ? `Your KemitVPN access is available on up to ${subscription?.plan?.maxDevices || account.device?.limit || 5} devices.` : "Choose a plan in the KemitVPN mobile app to activate VPN access."}</p>
          <div className="subscription-facts"><span><CalendarDays /><small>{subscription?.willRenew ? "Renews" : "Access through"}</small><strong>{date(subscription?.currentPeriodEnd)}</strong></span><span><Smartphone /><small>Device allowance</small><strong>{subscription?.plan?.maxDevices || account.device?.limit || 5} devices</strong></span></div>
        </article>

        <article className="account-card billing-provider-card">
          <span className="subscription-kicker">BILLING PROVIDER</span>
          <div className="provider-heading"><span className="provider-icon">{billing.icon}</span><span><h2>{billing.name}</h2><p>{billing.description}</p></span></div>
          {billing.manageUrl ? <a className="button button-quiet button-wide" href={billing.manageUrl} target="_blank" rel="noreferrer">Manage with {source === "apple" ? "Apple" : "Google Play"}<ExternalLink size={16} /></a> : source === "stripe" ? <div className="provider-note">A Stripe customer-portal endpoint is not configured in the v2 backend yet.</div> : source === "admin" ? <div className="provider-note">No payment method is charged for complimentary access.</div> : <div className="provider-note">Available billing options currently come from the KemitVPN app.</div>}
        </article>
      </div>

      <article className="account-card subscription-details"><div className="card-title"><span className="card-icon"><CalendarDays /></span><span><small>PLAN DETAILS</small><h2>Access information</h2></span></div><dl><div><dt>Status</dt><dd>{subscription?.status || "No subscription"}</dd></div><div><dt>Billing cycle</dt><dd>{subscription?.billingCycle?.replace(/_/g, " ") || "—"}</dd></div><div><dt>Started</dt><dd>{date(subscription?.currentPeriodStart)}</dd></div><div><dt>{subscription?.willRenew ? "Next renewal" : "Ends"}</dt><dd>{date(subscription?.currentPeriodEnd)}</dd></div><div><dt>Auto-renew</dt><dd>{subscription?.willRenew ? "On" : "Off"}</dd></div><div><dt>VPN account</dt><dd>{account.vpn.provisioned ? "Ready" : active ? "Created on first connection" : "Not available"}</dd></div></dl></article>
    </DashboardPage>
  );
}
