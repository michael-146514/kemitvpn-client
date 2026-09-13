import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { CircleHelp, CreditCard, LayoutDashboard, LockKeyhole, LogOut, Menu, MonitorSmartphone, Settings, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { displayName, useAuth } from "../lib/auth";
import type { Account } from "../types";
import { Brand } from "./Brand";

type DashboardContextValue = {
  account: Account | null;
  error: string;
  loading: boolean;
  refresh(): Promise<void>;
  updateAccount(update: (current: Account) => Account): void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

const links = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/account/subscription", label: "Subscription", icon: CreditCard },
  { to: "/account/devices", label: "Devices", icon: MonitorSmartphone },
  { to: "/account/support", label: "Support", icon: CircleHelp },
  { to: "/account/settings", label: "Settings", icon: Settings },
];

export function DashboardLayout() {
  const { auth, request, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const pageTitle = links.find((link) => link.end ? location.pathname === link.to : location.pathname.startsWith(link.to))?.label || "My account";

  const refresh = useCallback(async () => {
    setError("");
    try {
      setAccount(await request<Account>("/me"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your account couldn't be loaded.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.classList.toggle("dashboard-menu-open", open);
    return () => document.body.classList.remove("dashboard-menu-open");
  }, [open]);

  const context: DashboardContextValue = {
    account,
    error,
    loading,
    refresh,
    updateAccount: (update) => setAccount((current) => current ? update(current) : current),
  };

  return (
    <DashboardContext.Provider value={context}>
      <div className="dashboard-shell">
        <button className={`dashboard-scrim ${open ? "visible" : ""}`} aria-label="Close menu backdrop" onClick={() => setOpen(false)} />
        <aside className={`dashboard-sidebar ${open ? "open" : ""}`}>
          <div className="dashboard-brand"><Link to="/"><Brand /></Link><button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button></div>
          <nav aria-label="Account navigation">
            <span className="nav-label">MY ACCOUNT</span>
            {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? "active" : ""}><Icon />{label}</NavLink>)}
          </nav>
          <div className="sidebar-account">
            <span className="avatar">{(auth?.user.displayName || auth?.user.email || "K").slice(0, 1).toUpperCase()}</span>
            <span><strong>{displayName(auth?.user)}</strong><small>{auth?.user.email}</small></span>
          </div>
          <button className="sidebar-signout" onClick={() => void logout().then(() => navigate("/"))}><LogOut /> Sign out</button>
        </aside>

        <div className="dashboard-main">
          <header className="dashboard-topbar">
            <div><span>Client portal</span><strong>{pageTitle}</strong></div>
            <div className="topbar-actions"><span className="secure-label"><LockKeyhole />Secure session</span><Link className="topbar-support" to="/account/support"><CircleHelp />Help</Link><span className="topbar-divider" /><span className="topbar-user"><span className="mobile-avatar">{(auth?.user.displayName || auth?.user.email || "K").slice(0, 1).toUpperCase()}</span><span><strong>{displayName(auth?.user)}</strong><small>{auth?.user.email}</small></span></span></div>
          </header>
          <header className="dashboard-mobile-header">
            <button onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
            <Link to="/account"><Brand /></Link>
            <span className="mobile-avatar">{(auth?.user.displayName || auth?.user.email || "K").slice(0, 1).toUpperCase()}</span>
          </header>
          <main className="dashboard-content"><Outlet /></main>
          <footer className="dashboard-footer">
            <span>© {new Date().getFullYear()} Kemit Security</span>
            <div><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link><Link to="/account/support">Support</Link></div>
          </footer>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const value = useContext(DashboardContext);
  if (!value) throw new Error("useDashboard must be used inside DashboardLayout");
  return value;
}

export function DashboardPage({ title, eyebrow, description, actions, children }: { title: string; eyebrow: string; description: string; actions?: ReactNode; children: ReactNode }) {
  return <section className="dashboard-page"><header className="dashboard-page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{actions && <div className="page-actions">{actions}</div>}</header>{children}</section>;
}
