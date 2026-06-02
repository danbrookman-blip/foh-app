/**
 * Audit log (spec L1.1–L1.5).
 *
 * Append-only, tamper-evident, retained 7 years, surfaceable to head office,
 * finance, external auditor, and the customer via DSAR.
 *
 * Each entry's `prevHash` chains to the previous entry's `hash` — flipping or
 * removing a row anywhere in the chain breaks every downstream hash. This is the
 * tamper-evidence primitive; production replaces it with a write-only object store
 * (S3 with Object Lock, or a managed audit service) but the wire shape is the same.
 */

export type AuditAction =
  | "lookup"
  | "lookup_no_match"
  | "verification_sent"
  | "verification_confirmed"
  | "verification_confirmed_pin"
  | "verification_expired"
  | "verification_cancelled"
  | "redemption_logged"
  | "customer_registered"
  | "kindness_granted"
  | "note_added"
  | "signal_viewed";

export type AuditOutcome = "ok" | "denied" | "error" | "conflict";

export type AuditEntry = {
  /** Monotonically increasing sequence number. */
  seq: number;
  /** Hash chain pointer — equals previous entry's `hash`, or null on the first. */
  prevHash: string | null;
  /** This entry's signed hash, computed over the full canonical content. */
  hash: string;
  timestamp: number;
  action: AuditAction;
  outcome: AuditOutcome;
  /** Operator / brand scope — multi-tenancy (spec C1). */
  operatorId: string;
  venueId: string;
  staffId: string;
  sessionId: string;
  /** Hashed identifier (mobile / email). Never the raw value. */
  identifierHash?: string;
  entitlementId?: string;
  /** True when the PIN fallback (V1.2) was used to confirm. */
  fallbackUsed?: boolean;
  /** Free-form, but PII-free. Used to disambiguate (e.g. award code). */
  meta?: Record<string, string | number | boolean>;
};

export type AuditAppendInput = Omit<AuditEntry, "seq" | "prevHash" | "hash" | "timestamp">;
