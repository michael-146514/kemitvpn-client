import { Link } from "react-router-dom";

const terms = [
  ["Using KemitVPN", "You must use the service lawfully and must not interfere with the service, other customers, or the networks it connects to."],
  ["Accounts and subscriptions", "Keep your account secure. Paid subscriptions are managed through the store or channel where they were purchased, subject to that provider’s billing rules."],
  ["Service availability", "VPN availability can vary by location, network, device, maintenance, and circumstances outside our control."],
  ["Ending service", "You may stop using KemitVPN and delete your account. Deleting an account does not automatically cancel an App Store or Google Play subscription."],
];
const privacy = [
  ["Information you provide", "We process account details such as your email, display name, authentication information, subscription status, and support messages."],
  ["Service and device data", "We use limited device, session, security, and service diagnostics to authenticate you, enforce device limits, prevent abuse, and operate the VPN."],
  ["Payments", "Apple, Google, or another payment provider processes payment information. KemitVPN receives purchase and subscription status needed to provide access."],
  ["Your choices", "You can review signed-in devices, sign out sessions, update your profile, contact support, or request account deletion."],
];

export function LegalPage({ type }: { type: "terms" | "privacy" }) {
  const isTerms = type === "terms";
  const sections = isTerms ? terms : privacy;
  return <section className="legal-page"><div className="legal-heading"><span className="eyebrow">LEGAL</span><h1>{isTerms ? "Terms of Service" : "Privacy Policy"}</h1><p>Draft updated September 13, 2026 · Review with qualified counsel before public launch.</p></div><div className="legal-card"><p>{isTerms ? "These terms describe the basic rules for using KemitVPN services." : "This summary explains the categories of information used to provide and protect KemitVPN."}</p>{sections.map(([title, copy]) => <section key={title}><h2>{title}</h2><p>{copy}</p></section>)}<section><h2>Questions</h2><p>Email <a href="mailto:support@kemitsecurity.com">support@kemitsecurity.com</a> with questions about these terms or your information.</p></section></div><p className="legal-back"><Link to="/">← Back to KemitVPN</Link></p></section>;
}
