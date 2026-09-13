const DEVICE_ID_KEY = "kemit_web_device_id";

export function deviceHeaders(storage: Pick<Storage, "getItem" | "setItem"> = localStorage): Record<string, string> {
  let id = storage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    storage.setItem(DEVICE_ID_KEY, id);
  }

  const browser = navigator.userAgent.includes("Firefox")
    ? "Firefox"
    : navigator.userAgent.includes("Edg/")
      ? "Edge"
      : navigator.userAgent.includes("Chrome")
        ? "Chrome"
        : navigator.userAgent.includes("Safari")
          ? "Safari"
          : "Web browser";

  return {
    "X-Device-Id": id,
    "X-Device-Name": `${browser} on ${navigator.platform || "web"}`.slice(0, 120),
    "X-Device-Platform": "web",
    "X-App-Version": "client-web/1.0.0",
  };
}
