import { BookOpen, CreditCard, LifeBuoy, Mail, Send, Wifi } from "lucide-react";
import { useState, type FormEvent } from "react";
import { DashboardPage, useDashboard } from "../components/DashboardLayout";

export function SupportPage() {
  const { account } = useDashboard();
  const [topic, setTopic] = useState("Connection issue");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");

  const email = (event: FormEvent) => {
    event.preventDefault();
    const body = [`Topic: ${topic}`, `Account: ${account?.user.email || "Not available"}`, "", details].join("\n");
    window.location.href = `mailto:support@kemitsecurity.com?subject=${encodeURIComponent(subject || `KemitVPN ${topic}`)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <DashboardPage eyebrow="Help center" title="How can we help?" description="Start with a quick answer or send our support team the details.">
      <div className="support-options">
        <a href="#contact"><span><Wifi /></span><strong>Connection help</strong><p>Servers, protocols, or trouble connecting.</p></a>
        <a href="#contact"><span><CreditCard /></span><strong>Plan & billing</strong><p>Subscription status, renewals, or purchase help.</p></a>
        <a href="#answers"><span><BookOpen /></span><strong>Quick answers</strong><p>Common account and device questions.</p></a>
      </div>

      <div className="support-grid">
        <article className="account-card support-form-card" id="contact"><div className="card-title"><span className="card-icon"><LifeBuoy /></span><span><small>CONTACT SUPPORT</small><h2>Tell us what happened</h2></span></div><form onSubmit={email}><label><span>Topic</span><select value={topic} onChange={(event) => setTopic(event.target.value)}><option>Connection issue</option><option>Account access</option><option>Plan or billing</option><option>Device limit</option><option>Privacy question</option><option>Something else</option></select></label><label><span>Subject</span><input required maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="A short description" /></label><label><span>What can we help with?</span><textarea required minLength={10} maxLength={4000} rows={6} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Include what you expected, what happened, and the device you’re using." /></label><p><Mail size={15} />This opens your email app and sends to support@kemitsecurity.com.</p><button className="button"><Send size={17} />Open support email</button></form></article>
        <article className="account-card faq-card" id="answers"><div className="card-title"><span className="card-icon"><BookOpen /></span><span><small>QUICK ANSWERS</small><h2>Before you write</h2></span></div><div className="faq-list"><details><summary>Why can’t this browser connect to the VPN?</summary><p>The website manages your account. Install the native KemitVPN app to create the secure tunnel.</p></details><details><summary>Why is my device waiting?</summary><p>Your account reached its device limit. Open Devices and sign out one you no longer use.</p></details><details><summary>My subscription is active but VPN isn’t ready.</summary><p>The VPN account is normally created on your first connection. Refresh your account, then try once more in the app.</p></details><details><summary>How do I reset my password?</summary><p>Sign out, choose Forgot password on the login page, and follow the email link.</p></details></div></article>
      </div>
    </DashboardPage>
  );
}
