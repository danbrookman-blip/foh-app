/**
 * Public types returned by the Airship adapter.
 *
 * Design rule: nothing here leaks PII to the manager UI.
 * The opaque `customerRef` is the only handle the UI gets.
 */

export type CustomerRef = string;

export type VoucherType = "birthday" | "loyalty" | "recovery" | "welcome" | "promotional";

export type Voucher = {
  id: string;
  title: string;
  description: string;
  /** Display value — e.g. "£20 off", "Free drink". Pre-formatted, no currency maths in UI. */
  value: string;
  type: VoucherType;
  expiresAt: number;
  redeemable: boolean;
};

export type LookupResult =
  | { match: false }
  | {
      match: true;
      customerRef: CustomerRef;
      /** Soft signal for the arrivals/Strava layer — never the manager lookup screen. */
      tierBucket: "new" | "regular" | "vip" | "at-risk" | "recovery";
      vouchers: Voucher[];
    };

export type CustomerSignals = {
  customerRef: CustomerRef;
  /** First name + last initial only. The compromise between social warmth and PII. */
  displayName: string;
  tier: "new" | "regular" | "vip" | "at-risk" | "recovery";
  lastVisitAt: number;
  visitsLast90Days: number;
  lifetimeVisits: number;
  favouriteCategory: string;
  lastItemOrdered: string;
  birthdayThisMonth: boolean;
};

export type RegisterCustomerInput = {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  consentMarketing: boolean;
};

export type RegisterCustomerResult =
  | { ok: true; customerRef: CustomerRef }
  | { ok: false; reason: "duplicate" | "invalid" };

/**
 * A free-text note a manager attaches to a customer profile.
 * Visible to all managers at the venue (and possibly brand-wide in production).
 *
 * Note: notes can contain sensitive info (allergies, preferences, sometimes opinions).
 * Production wiring should add: audit log, edit/delete with reason, retention policy,
 * and a content guard for slurs or PII-bait. Out of scope for prototype.
 */
export type CustomerNote = {
  id: string;
  customerRef: CustomerRef;
  body: string;
  /** Who wrote it — for accountability. */
  authorName: string;
  venueName: string;
  createdAt: number;
};
