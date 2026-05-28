import { randomBytes } from "crypto";

/**
 * Verification — the trust mechanic.
 *
 * The manager triggers a send; the customer confirms; redemption only proceeds
 * if the customer was demonstrably present (they clicked the link on their own phone).
 * The store is in-memory for the prototype; production would back this with Redis or
 * a short-lived DB row, since the lifetime is minutes.
 */

export type VerificationItem =
  | { kind: "voucher"; id: string; title: string; value: string }
  | { kind: "giftcard"; id: string; maskedCode: string; balancePence: number };

export type VerificationStatus = "pending" | "confirmed" | "expired" | "cancelled";

export type Verification = {
  token: string;
  customerRef: string;
  venueName: string;
  managerName: string;
  channel: "sms" | "email";
  items: VerificationItem[];
  status: VerificationStatus;
  createdAt: number;
  expiresAt: number;
  confirmedAt?: number;
};

const TTL_MS = 10 * 60 * 1000;
const verifications = new Map<string, Verification>();

function newToken(): string {
  return randomBytes(16).toString("base64url");
}

export function createVerification(input: {
  customerRef: string;
  venueName: string;
  managerName: string;
  channel: "sms" | "email";
  items: VerificationItem[];
}): Verification {
  const token = newToken();
  const now = Date.now();
  const v: Verification = {
    token,
    customerRef: input.customerRef,
    venueName: input.venueName,
    managerName: input.managerName,
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

export function cancelVerification(token: string): Verification | null {
  const v = getVerification(token);
  if (!v) return null;
  if (v.status === "pending") v.status = "cancelled";
  return v;
}
