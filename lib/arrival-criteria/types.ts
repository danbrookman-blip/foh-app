/**
 * Arrival-trigger criteria — what makes a known guest's arrival "worth pinging
 * the manager about" vs. "worth showing in the feed only."
 *
 * The criteria are deliberately small in number (6) and deterministic. Anything
 * AI-derived ("predicted to upgrade", "likely to complain") is out of scope for
 * v1 per spec G3.4.
 *
 * Each evaluation result is independent — multiple criteria can fire on one
 * arrival (e.g. VIP + birthday + voucher expiring). The UI shows all triggered
 * criteria; the push body summarises the highest-priority one.
 */

export type CriterionCode =
  | "vip"
  | "birthday_month"
  | "lapsed_returning"
  | "at_risk"
  | "voucher_expiring"
  | "large_booking";

export type CriterionConfig = {
  enabled: boolean;
  /** Lapsed-returning threshold: visit gap (days) before we treat them as returning. */
  lapsedDays?: number;
  /** Voucher-expiring threshold: days until expiry that triggers the ping. */
  voucherExpiryDays?: number;
  /** Large-booking threshold: party size at/above which to ping. */
  largeBookingSize?: number;
};

export type CriteriaConfig = Record<CriterionCode, CriterionConfig>;

export type CriterionEvaluation = {
  code: CriterionCode;
  /** Short pill label for the arrival card. */
  label: string;
  /** Short headline for push body. */
  headline: string;
  /** Higher = more important. The push body uses the highest-priority criterion. */
  priority: number;
};

/**
 * Defaults aligned with the conversation: VIP, birthday-month, lapsed-returning,
 * at-risk, voucher-expiring on by default; large-booking on but tunable per venue.
 */
export const DEFAULT_CRITERIA: CriteriaConfig = {
  vip: { enabled: true },
  birthday_month: { enabled: true },
  lapsed_returning: { enabled: true, lapsedDays: 60 },
  at_risk: { enabled: true },
  voucher_expiring: { enabled: true, voucherExpiryDays: 14 },
  large_booking: { enabled: true, largeBookingSize: 8 },
};
