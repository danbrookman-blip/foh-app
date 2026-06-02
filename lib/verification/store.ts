import { createHmac, randomBytes, randomInt } from "crypto";

/**
 * Verification — the trust mechanic.
 *
 * Spec alignment:
 *  - V1.1 — 5-minute expiry (down from prototype's 10)
 *  - V1.2 — PIN-readback fallback minted alongside the link
 *  - V1.3 — HMAC-signed token, bound to (identifierHash, venueId, entitlementIds, sessionId)
 *  - V1.4 — channel locked to identifier kind, not manager choice
 *  - V1.5 — no staff-side override that bypasses confirmation
 *
 * In-memory for the prototype; production replaces with a short-lived store
 * (Redis with TTL).
 */

export type VerificationItem =
  | { kind: "voucher"; id: string; title: string; value: string }
  | { kind: "giftcard"; id: string; maskedCode: string; balancePence: number };

export type VerificationStatus = "pending" | "confirmed" | "expired" | "cancelled";

export type VerificationChannel = "sms" | "email";

export type Verification = {
  token: string;
  /** 6-digit PIN for V1.2 fallback. Manager reads it to the customer if SMS fails. */
  pin: string;
  /** Attempts at PIN entry, capped to mitigate brute force (V1.2 rate-limit). */
  pinAttempts: number;
  /** HMAC signature binding the token to its content (V1.3). */
  signature: string;
  customerRef: string;
  /** Hash of the identifier; the raw value is never stored here (P1.4). */
  identifierHash: string;
  venueId: string;
  venueName: string;
  managerName: string;
  sessionId: string;
  /** Channel is determined by the identifier kind, not manager choice (V1.4). */
  channel: VerificationChannel;
  items: VerificationItem[];
  status: VerificationStatus;
  createdAt: number;
  expiresAt: number;
  confirmedAt?: number;
  fallbackUsed?: boolean;
};

const TTL_MS = 5 * 60 * 1000; // V1.1
const MAX_PIN_ATTEMPTS = 5; // V1.2
const SIGNING_SECRET =
  process.env.FOH_VERIFY_SECRET ??
  "demo-only-verify-secret-replace-via-env-FOH_VERIFY_SECRET";

const verifications = new Map<string, Verification>();

function newToken(): string {
  return randomBytes(16).toString("base64url");
}

function newPin(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function signToken(input: {
  token: string;
  identifierHash: string;
  venueId: string;
  itemIds: string[];
  sessionId: string;
}): string {
  return createHmac("sha256", SIGNING_SECRET)
    .update(input.token)
    .update("|")
    .update(input.identifierHash)
    .update("|")
    .update(input.venueId)
    .update("|")
    .update(input.itemIds.slice().sort().join(","))
    .update("|")
    .update(input.sessionId)
    .digest("base64url");
}

export function createVerification(input: {
  customerRef: string;
  identifierHash: string;
  venueId: string;
  venueName: string;
  managerName: string;
  sessionId: string;
  channel: VerificationChannel;
  items: VerificationItem[];
}): Verification {
  const token = newToken();
  const pin = newPin();
  const now = Date.now();
  const signature = signToken({
    token,
    identifierHash: input.identifierHash,
    venueId: input.venueId,
    itemIds: input.items.map((i) => `${i.kind}:${i.id}`),
    sessionId: input.sessionId,
  });
  const v: Verification = {
    token,
    pin,
    pinAttempts: 0,
    signature,
    customerRef: input.customerRef,
    identifierHash: input.identifierHash,
    venueId: input.venueId,
    venueName: input.venueName,
    managerName: input.managerName,
    sessionId: input.sessionId,
    channel: input.channel,
    items: input.items,
    status: "pending",
    createdAt: now,
    expiresAt: now + TTL_MS,
  };
  verifications.set(token, v);
  return v;
}

export function getVerification(token: string): Verification | null {
  const v = verifications.get(token);
  if (!v) return null;
  if (v.status === "pending" && Date.now() > v.expiresAt) {
    v.status = "expired";
  }
  return v;
}

export function confirmVerification(token: string): Verification | null {
  const v = getVerification(token);
  if (!v) return null;
  if (v.status !== "pending") return v;
  v.status = "confirmed";
  v.confirmedAt = Date.now();
  return v;
}

/**
 * V1.2 — PIN fallback. Returns success/fail; tracks attempts; flags fallback use.
 */
export function confirmWithPin(token: string, pin: string):
  | { ok: true; verification: Verification }
  | { ok: false; reason: "not_found" | "expired" | "cancelled" | "pin_wrong" | "rate_limited" } {
  const v = getVerification(token);
  if (!v) return { ok: false, reason: "not_found" };
  if (v.status === "expired") return { ok: false, reason: "expired" };
  if (v.status === "cancelled") return { ok: false, reason: "cancelled" };
  if (v.pinAttempts >= MAX_PIN_ATTEMPTS) return { ok: false, reason: "rate_limited" };
  v.pinAttempts += 1;
  if (pin.trim() !== v.pin) return { ok: false, reason: "pin_wrong" };
  v.status = "confirmed";
  v.confirmedAt = Date.now();
  v.fallbackUsed = true;
  return { ok: true, verification: v };
}

export function cancelVerification(token: string): Verification | null {
  const v = getVerification(token);
  if (!v) return null;
  if (v.status === "pending") v.status = "cancelled";
  return v;
}
