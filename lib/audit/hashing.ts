import { createHmac } from "crypto";

/**
 * Identifier hashing (spec P1.4 / P1.8 / O1).
 *
 * The audit log and application logs store identifier *hashes* — not raw mobile
 * numbers or emails. The raw → hash mapping lives in a separately permissioned
 * store accessible only for DSAR/audit, not modelled in the prototype.
 *
 * Production must use a stable per-operator HMAC secret from a secrets manager.
 * The prototype uses a build-time fallback — adequate for demo, not for prod.
 */
const SECRET =
  process.env.FOH_HASH_SECRET ??
  "demo-only-secret-not-for-production-replace-via-env-FOH_HASH_SECRET";

export function hashIdentifier(raw: string): string {
  return createHmac("sha256", SECRET).update(raw.trim().toLowerCase()).digest("hex");
}

/** Short prefix for log readability; never the full hash in observability. */
export function hashIdentifierShort(raw: string): string {
  return hashIdentifier(raw).slice(0, 12);
}
