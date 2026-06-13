"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CRITERIA, type CriterionCode } from "@/lib/arrival-criteria";

type Permission = "default" | "granted" | "denied" | "unsupported";

const CRITERION_LABELS: Record<CriterionCode, string> = {
  vip: "VIP arrives",
  birthday_month: "Birthday this month",
  lapsed_returning: "Lapsed regular returning",
  at_risk: "At-risk / recovery",
  voucher_expiring: "Voucher about to expire",
  large_booking: "Large booking (8+)",
};

export function PushSetup() {
  const [permission, setPermission] = useState<Permission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Record<CriterionCode, boolean>>(() => {
    const out: Record<CriterionCode, boolean> = {} as Record<CriterionCode, boolean>;
    for (const code of Object.keys(DEFAULT_CRITERIA) as CriterionCode[]) {
      out[code] = DEFAULT_CRITERIA[code].enabled;
    }
    return out;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Read current permission + subscription state on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as Permission);
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setSubscribed(true);
        setEndpoint(sub.endpoint);
      }
    });
  }, []);

  const subscribe = useCallback(async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as Permission);
      if (perm !== "granted") {
        setError("Notifications denied. Enable them in your browser settings to receive arrival pings.");
        return;
      }
      const keyRes = await fetch("/api/push/public-key");
      const { publicKey } = await keyRes.json();
      if (!publicKey) {
        setError("Server is missing VAPID keys. Check .env.local.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const serial = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: serial,
          preferences: { criteria: prefs },
        }),
      });
      if (!res.ok) {
        setError("Couldn't register subscription on the server.");
        return;
      }
      setSubscribed(true);
      setEndpoint(sub.endpoint);
      setInfo("Notifications on. Try the demo trigger below.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Subscribe failed.");
    } finally {
      setBusy(false);
    }
  }, [prefs]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setEndpoint(null);
      setInfo("Notifications off.");
    } finally {
      setBusy(false);
    }
  }, []);

  const updatePrefs = useCallback(
    async (next: Record<CriterionCode, boolean>) => {
      setPrefs(next);
      if (!subscribed) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return;
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          preferences: { criteria: next },
        }),
      });
    },
    [subscribed],
  );

  const sendTest = useCallback(async () => {
    if (!endpoint) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    const res = await fetch("/api/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(`Test failed: ${data?.error ?? res.statusText}`);
      return;
    }
    setInfo("Test sent. Check your notifications.");
  }, [endpoint]);

  if (permission === "unsupported") {
    return (
      <div className="card p-4 bg-surface-alt">
        <div className="section-label">Arrival notifications</div>
        <p className="text-sm text-ink-muted mt-1">
          Web Push isn't supported on this browser. On iPhone, install Lookout to your
          home screen and open it from there to enable notifications (requires iOS 16.4+).
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="section-label">Arrival notifications</div>
          <p className="text-sm text-ink-muted mt-0.5">
            {subscribed
              ? "On — you'll be pinged when criteria below match."
              : "Off — open the feed manually, or turn on to get a heads-up."}
          </p>
        </div>
        {subscribed ? (
          <button
            type="button"
            disabled={busy}
            onClick={unsubscribe}
            className="btn-ghost px-3 py-2 text-sm min-h-0"
          >
            Turn off
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || permission === "denied"}
            onClick={subscribe}
            className="btn-primary px-3 py-2 text-sm min-h-0"
          >
            {permission === "denied" ? "Blocked" : "Turn on"}
          </button>
        )}
      </div>

      {permission === "denied" ? (
        <p className="text-xs text-warn">
          Notifications were blocked. Enable them in your browser site settings, then
          come back and turn them on.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-1 pt-2 border-t border-navy-100">
        <div className="section-label">Ping me when</div>
        {(Object.keys(CRITERION_LABELS) as CriterionCode[]).map((code) => (
          <label
            key={code}
            className="flex items-center justify-between gap-3 py-1.5 text-sm"
          >
            <span>{CRITERION_LABELS[code]}</span>
            <input
              type="checkbox"
              checked={prefs[code]}
              onChange={(e) =>
                updatePrefs({ ...prefs, [code]: e.target.checked })
              }
              className="h-5 w-5 accent-warm-purple"
            />
          </label>
        ))}
      </div>

      {subscribed ? (
        <button
          type="button"
          disabled={busy}
          onClick={sendTest}
          className="btn-ghost w-full text-sm"
        >
          Send a test ping
        </button>
      ) : null}

      {info ? <div className="text-xs text-ok">{info}</div> : null}
      {error ? <div className="text-xs text-accent">{error}</div> : null}

      <p className="text-[11px] text-ink-subtle">
        iPhone managers: add Lookout to your home screen first (Share → Add to Home
        Screen). iOS only supports Web Push for installed PWAs.
      </p>
    </div>
  );
}

// VAPID public key is base64url; pushManager.subscribe needs a Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
