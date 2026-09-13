import { Laptop, RefreshCw, Smartphone, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardPage, useDashboard } from "../components/DashboardLayout";
import { useAuth } from "../lib/auth";
import type { DeviceList } from "../types";

const date = (value: string) => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
const DeviceIcon = ({ platform }: { platform: string }) => /ios|android|phone|ipad/i.test(platform) ? <Smartphone /> : <Laptop />;

export function DevicesPage() {
  const { account } = useDashboard();
  const { request, clear } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<DeviceList | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try { setDevices(await request<DeviceList>("/me/devices")); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Devices couldn't be loaded."); }
  }, [request]);

  useEffect(() => { void load(); }, [load]);

  const remove = async (id: string, current: boolean) => {
    setBusy(id); setError("");
    try {
      const next = await request<DeviceList>(`/me/devices/${id}`, { method: "DELETE" });
      if (current) { clear(); navigate("/login", { replace: true }); return; }
      setDevices(next); setNotice("That device was signed out.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "That device couldn't be signed out."); }
    finally { setBusy(""); }
  };

  return (
    <DashboardPage eyebrow="Security" title="Your devices" description="See where your account is signed in and remove anything you don’t recognize." actions={<button className="button button-quiet" onClick={() => void load()}><RefreshCw size={17} />Refresh</button>}>
      {error && <div className="message error dashboard-message">{error}</div>}
      {notice && <div className="message success dashboard-message">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      <div className="device-summary"><span><strong>{devices?.activeDevices ?? account?.device?.activeDevices ?? 0}</strong>Active devices</span><span><strong>{devices?.limit ?? account?.device?.limit ?? 5}</strong>Device limit</span><p>A signed-out device must log in again before it can use your VPN subscription.</p></div>
      <article className="account-card devices-card standalone">
        <div className="devices-heading"><div className="card-title"><span className="card-icon"><Laptop /></span><span><small>TRUSTED ACCESS</small><h2>Signed-in devices</h2></span></div><span>{devices?.devices.length ?? 0} total</span></div>
        <div className="device-list">
          {!devices && !error && <div className="inline-loader"><span className="spinner" />Loading devices…</div>}
          {devices?.devices.map((device) => <div className="device-row" key={device.id}><span className="device-icon"><DeviceIcon platform={device.platform} /></span><div className="device-info"><strong>{device.name || "Unknown device"} {device.current && <em>This device</em>}</strong><span>{device.platform} · Last active {date(device.lastSeenAt)}</span></div><span className={`device-state ${device.status}`}>{device.status}</span><button className="icon-button danger" disabled={busy === device.id} title={`Sign out ${device.name}`} onClick={() => void remove(device.id, device.current)}>{busy === device.id ? <span className="tiny-spinner" /> : <Trash2 size={17} />}</button></div>)}
          {devices && !devices.devices.length && <div className="dashboard-empty small"><Laptop /><h2>No devices yet</h2><p>Your devices will appear after you sign in.</p></div>}
        </div>
      </article>
    </DashboardPage>
  );
}
