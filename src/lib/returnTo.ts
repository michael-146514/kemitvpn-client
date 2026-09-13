/**
 * Where to send the user after signing in. Only same-site paths are accepted,
 * so a crafted link can't bounce someone to another website.
 */
export function safeReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/** The return path carried in router state, e.g. from the app sign-in page. */
export function returnPathFromState(state: unknown): string | null {
  return safeReturnPath((state as { from?: unknown } | null)?.from);
}

/** True when the user is signing in on behalf of a KemitVPN app. */
export const isAppSignIn = (path: string | null) => Boolean(path?.startsWith("/oauth/authorize"));
