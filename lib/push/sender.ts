import webpush from "web-push";
import type { CustomerSignals } from "@/lib/airship/types";
import type { CriterionEvaluation } from "@/lib/arrival-criteria";
import { removeByEndpoint } from "./store";
import type { PushPayload, StoredSubscription } from "./types";

/**
 * Push sender. Wraps the web-push library.
 *
 * Privacy mode (PUSH_PRIVACY env var):
 *  - "minimal" — payload contains no name, no signals. Title is generic. Manager
 *    sees who arrived only after tapping in. Aligned with spec data-minimisation.
 *  - "named" — payload contains display name + headline criterion. More expressive
 *    for demo, but exposes information on the lock screen.
 */

const PUB = process.env.VAPID_PUBLIC_KEY ?? "";
const PRIV = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:ops@example.com";
const PRIVACY = (process.env.PUSH_PRIVACY ?? "minimal") as "minimal" | "named";

if (PUB && PRIV) {
  webpush.setVapidDetails(SUBJECT, PUB, PRIV);
}

export function vapidPublicKey(): string {
  return PUB;
}

export function buildPayload(input: {
  customerRef: string;
  signals: CustomerSignals;
  triggered: CriterionEvaluation[];
}): PushPayload {
  const top = input.triggered[0];
  const tag = `arrival-${input.customerRef}`;
  const url = `/arrivals#${input.customerRef}`;

  if (PRIVACY === "minimal") {
    return {
      title: "Known guest just arrived",
      body: "Open Lookout to see who.",
      url,
      tag,
    };
  }

  return {
    title: `${input.signals.displayName} just arrived`,
    body: input.triggered.length > 1
      ? `${top.headline} · +${input.triggered.length - 1} more`
      : top.headline,
    url,
    tag,
  };
}

export async function sendPush(
  sub: StoredSubscription,
  payload: PushPayload,
): Promise<{ ok: true } | { ok: false; reason: string; gone?: boolean }> {
  if (!PUB || !PRIV) {
    return { ok: false, reason: "vapid_not_configured" };
  }
  try {
    await webpush.sendNotification(
      sub.subscription as unknown as webpush.PushSubscription,
      JSON.stringify(payload),
    );
    return { ok: true };
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode;
    // 404 / 410 → subscription gone, drop it.
    if (status === 404 || status === 410) {
      removeByEndpoint(sub.subscription.endpoint);
      return { ok: false, reason: "subscription_gone", gone: true };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: msg };
  }
}
