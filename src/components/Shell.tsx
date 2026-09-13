import { ArrowRight, LogOut } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { displayName, useAuth } from "../lib/auth";
import { Brand } from "./Brand";

export function Shell() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="logo-link"><Brand /></Link>
        <nav aria-label="Primary navigation">
          <a href="/#how-it-works">How it works</a>
          <a href="/#privacy">Privacy</a>
          {auth ? (
            <>
              <Link to="/account" className="nav-account">Hi, {displayName(auth.user)}</Link>
              <button className="icon-button" title="Sign out" onClick={() => void logout().then(() => navigate("/"))}><LogOut size={18} /></button>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/signup" className="button button-small">Get started <ArrowRight size={15} /></Link>
            </>
          )}
        </nav>
      </header>
      <main><Outlet /></main>
      <footer>
        <Brand compact />
        <span>© {new Date().getFullYear()} Kemit Security. Simple privacy, everywhere.</span>
        <div className="footer-links"><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><a href="mailto:support@kemitsecurity.com">Support</a></div>
      </footer>
    </div>
  );
}
