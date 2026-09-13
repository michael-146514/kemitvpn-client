export type Provider = "apple" | "google";

export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  expiresIn: number;
  tokenType: "bearer";
};

export type User = {
  id: string;
  email: string | null;
  displayName: string | null;
  status: string;
  providers: string[];
  emailConfirmed: boolean | null;
  createdAt: string;
};

export type DeviceStatus = {
  id: string;
  status: "active" | "waiting" | "signed_out";
  limit: number;
  activeDevices: number;
};

export type MfaState = {
  enabled: boolean;
  verified: boolean;
  required: boolean;
  methods: string[];
};

export type AuthResult = {
  session: Session;
  user: User;
  device: DeviceStatus | null;
  mfa: MfaState;
};

export type Subscription = {
  id: string;
  status: string;
  source: string;
  billingCycle: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  willRenew: boolean;
  isTrial: boolean;
  hasActiveSubscription: boolean;
  plan: { id: string; name: string; price: number | null; maxDevices: number; features: string[] } | null;
};

export type Account = {
  user: User;
  subscription: Subscription | null;
  vpn: { provisioned: boolean; state: string | null };
  device: DeviceStatus | null;
};

export type Device = {
  id: string;
  name: string;
  platform: string;
  appVersion: string | null;
  status: "active" | "waiting" | "signed_out";
  current: boolean;
  signedInAt: string;
  lastSeenAt: string;
};

export type DeviceList = {
  limit: number | null;
  activeDevices: number;
  current: { id: string; status: string } | null;
  devices: Device[];
};
