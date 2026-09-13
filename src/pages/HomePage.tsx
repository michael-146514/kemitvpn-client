import { ArrowRight, Check, Globe2, Laptop, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function HomePage() {
  const { auth } = useAuth();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><ShieldCheck size={16} /> Privacy without the puzzle</span>
          <h1>Your internet.<br /><span>Your business.</span></h1>
          <p>KemitVPN keeps your connection private with a clean, dependable experience across all your devices.</p>
          <div className="hero-actions">
            <Link className="button" to={auth ? "/account" : "/signup"}>{auth ? "Open my account" : "Create your account"} <ArrowRight size={18} /></Link>
            <Link className="button button-quiet" to={auth ? "/account" : "/login"}>{auth ? "Manage devices" : "I already have an account"}</Link>
          </div>
          <div className="trust-line"><Check size={16} /> One account <Check size={16} /> Up to five devices <Check size={16} /> Cancel anytime</div>
        </div>
        <div className="hero-visual" aria-label="KemitVPN connection preview">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="connection-card">
            <div className="connection-top"><span className="status-dot" /> Protected <span>•••</span></div>
            <div className="shield-ring"><ShieldCheck size={58} /></div>
            <strong>Connection secured</strong>
            <p>Chicago, United States</p>
            <div className="connection-meta"><span><small>PROTOCOL</small>WireGuard</span><span><small>STATUS</small>Private</span></div>
          </div>
        </div>
      </section>

      <section className="feature-strip" id="how-it-works">
        <div><LockKeyhole /><strong>Private by default</strong><span>Your traffic stays yours.</span></div>
        <div><Globe2 /><strong>Global access</strong><span>Connect wherever you are.</span></div>
        <div><Smartphone /><strong>Made for every day</strong><span>Tap once and get moving.</span></div>
      </section>

      <section className="simple-section" id="privacy">
        <span className="eyebrow">One account, less friction</span>
        <h2>Everything you need.<br />Nothing you don’t.</h2>
        <p>Sign in once, see your plan, and manage every device connected to your KemitVPN account.</p>
        <div className="steps">
          <article><span>01</span><div><h3>Create your account</h3><p>Use email, Apple, or Google through our protected sign-in flow.</p></div></article>
          <article><span>02</span><div><h3>Choose your coverage</h3><p>Activate a plan in the KemitVPN app and use it everywhere.</p></div></article>
          <article><span>03</span><div><h3>Connect your devices</h3><p>Use your account on mobile and desktop, with device controls here.</p></div></article>
        </div>
        <div className="platforms"><Smartphone /> iOS & Android <Laptop /> macOS & Windows</div>
      </section>
    </>
  );
}
