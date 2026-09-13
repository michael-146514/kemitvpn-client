import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Shell } from "./components/Shell";
import { DashboardLayout } from "./components/DashboardLayout";
import { useAuth } from "./lib/auth";
import { AccountPage } from "./pages/AccountPage";
import { AuthPage } from "./pages/AuthPage";
import { DevicesPage } from "./pages/DevicesPage";
import { HomePage } from "./pages/HomePage";
import { LegalPage } from "./pages/LegalPage";
import { MfaPage } from "./pages/MfaPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { OAuthAuthorizePage } from "./pages/OAuthAuthorizePage";
import { SettingsPage } from "./pages/SettingsPage";
import { SupportPage } from "./pages/SupportPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";

function Protected({ children }: { children: React.ReactNode }) {
  const { auth, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="page-loader"><span className="spinner" />Opening your account…</div>;
  if (!auth) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (auth.mfa?.required && location.pathname !== "/verify") return <Navigate to="/verify" replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="signup" element={<AuthPage mode="signup" />} />
        <Route path="auth/callback" element={<OAuthCallbackPage />} />
        <Route path="oauth/authorize" element={<OAuthAuthorizePage />} />
        <Route path="verify" element={<Protected><MfaPage /></Protected>} />
        <Route path="terms" element={<LegalPage type="terms" />} />
        <Route path="privacy" element={<LegalPage type="privacy" />} />
      </Route>
      <Route path="account" element={<Protected><DashboardLayout /></Protected>}>
        <Route index element={<AccountPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/account" replace />} />
      </Route>
      <Route element={<Shell />}>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
