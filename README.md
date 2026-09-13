# KemitVPN client website

Simple customer-facing website and account portal. It talks only to the KemitVPN client backend (`server_v2`) and does not contain Supabase or PureWL secrets.

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

The local website is `http://localhost:5174`. Add these values to the client backend environment and restart it:

```env
CORS_ORIGINS=http://localhost:5174
OAUTH_REDIRECT_URLS=kemitvpn://auth/callback,http://localhost:5174/auth/callback
```

Also add `http://localhost:5174/auth/callback` to Supabase → Authentication → URL Configuration → Redirect URLs.

## Environments

The website follows whichever client backend `VITE_KEMIT_API_URL` points at (it's baked in at build time):

| Environment | Website | `VITE_KEMIT_API_URL` | Client backend `ACCOUNT_WEBSITE_URL` |
| --- | --- | --- | --- |
| Local | `http://localhost:5174` | `http://localhost:4000` | `http://localhost:5174` |
| Development | `https://account.nexfyr.com` | `https://vpn.nexfyr.com` | `https://account.nexfyr.com` |
| Production | `https://account.kemitvpn.com` | `https://<production-api-domain>` | `https://account.kemitvpn.com` |

For Apple/Google on the website, also add `<website>/auth/callback` to that backend's `OAUTH_REDIRECT_URLS` and to Supabase Redirect URLs.

## What it includes

- Landing page.
- Email sign-in and account creation.
- Apple/Google browser OAuth using Authorization Code + PKCE through `server_v2`.
- Two-factor verification.
- "Sign in with KemitVPN" page (`/oauth/authorize`) that the desktop and mobile apps open to sign in; see `docs_app/content/backend/app-oauth.md`.
- Session refresh and secure logout.
- Dedicated subscription view with plan dates, VPN readiness, and Apple, Google, Stripe, or complimentary billing-source labels.
- Profile editing.
- Responsive client dashboard with a desktop top bar and sidebar for Overview, Subscription, Devices, Support, and Settings.
- Signed-in device management plus a mobile header and navigation drawer.
- Support email composer and quick troubleshooting answers.
- Draft Terms of Service and Privacy Policy pages for legal review.

This is an account website, not a browser VPN client. Native mobile/desktop apps establish the VPN tunnel.

Apple and Google subscriptions link to their platform subscription managers. Stripe subscriptions are identified, but the website cannot open a Stripe billing portal until `server_v2` exposes a customer-portal endpoint.

## Checks

```bash
npm test
npm run build
```

For production, set `VITE_KEMIT_API_URL` and `VITE_OAUTH_REDIRECT_URL` at build time, then add the exact website origin/callback to `CORS_ORIGINS`, `OAUTH_REDIRECT_URLS`, and Supabase's redirect allowlist.
