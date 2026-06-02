/**
 * Per-operator tenant configuration (spec F3.4, C1).
 *
 * In production this is set by brand admins. The prototype hardcodes one
 * operator with sensible defaults that match the spec. The adapter exists so
 * the API surface is stable when the configurability arrives.
 */

export type SignalCode =
  | "recency"
  | "frequency"
  | "spend_bracket"
  | "last_item"
  | "birthday_month";

/** P3.3 — guests can opt out of having their signal profile shown. */
export type SignalOptOut = {
  /** Hashed identifier (mobile / email) of the guest who opted out. */
  identifierHash: string;
  effectiveFrom: number;
};

export type TenantConfig = {
  operatorId: string;
  displayName: string;
  /** F3.4 — each signal individually toggleable. Defaults are all on. */
  signalToggles: Record<SignalCode, boolean>;
  /** P3.3 — list of opted-out identifier hashes. */
  signalOptOuts: SignalOptOut[];
  /** V1.1 — operator can tighten the verification window further; not loosen. */
  verificationExpiryMs: number;
};
