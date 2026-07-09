import type { CustomerSignals, Voucher } from "@/lib/airship/types";
import type {
  CriteriaConfig,
  CriterionEvaluation,
} from "./types";

/**
 * Pure deterministic criteria evaluation. No I/O. Easy to unit test.
 *
 * Input:
 *  - signals: customer's bracketed signal profile (no PII)
 *  - vouchers: their currently-redeemable vouchers (for voucher_expiring)
 *  - bookingSize: party size if known from booking source, else null
 *  - config: per-venue criteria config (which are enabled, thresholds)
 *
 * Output: ordered list of triggered criteria, highest priority first.
 */
export function evaluateArrival(input: {
  signals: CustomerSignals;
  vouchers: Voucher[];
  bookingSize: number | null;
  config: CriteriaConfig;
}): CriterionEvaluation[] {
  const out: CriterionEvaluation[] = [];
  const { signals, vouchers, bookingSize, config } = input;
  const DAY = 86_400_000;
  const now = Date.now();

  if (config.vip.enabled && signals.tier === "vip") {
    out.push({
      code: "vip",
      label: "VIP",
      headline: "VIP just arrived",
      priority: 90,
    });
  }

  if (config.birthday_month.enabled && signals.birthdayThisMonth) {
    out.push({
      code: "birthday_month",
      label: "Birthday month",
      headline: "Birthday this month",
      priority: 85,
    });
  }

  if (config.anniversary.enabled && signals.anniversaryThisMonth) {
    out.push({
      code: "anniversary",
      label: "Anniversary",
      headline: "Anniversary this month",
      priority: 83,
    });
  }

  if (config.at_risk.enabled && (signals.tier === "at-risk" || signals.tier === "recovery")) {
    out.push({
      code: "at_risk",
      label: signals.tier === "at-risk" ? "At risk" : "Recovery",
      headline:
        signals.tier === "at-risk"
          ? "At-risk regular — warm welcome"
          : "Recovery — last visit was rocky",
      priority: 80,
    });
  }

  if (config.lapsed_returning.enabled) {
    const lapsedDays = config.lapsed_returning.lapsedDays ?? 60;
    const daysSinceLast = (now - signals.lastVisitAt) / DAY;
    if (daysSinceLast >= lapsedDays && signals.lifetimeVisits >= 5) {
      out.push({
        code: "lapsed_returning",
        label: "Lapsed regular",
        headline: `Returning after ${Math.round(daysSinceLast)} days`,
        priority: 75,
      });
    }
  }

  if (config.voucher_expiring.enabled) {
    const within = (config.voucher_expiring.voucherExpiryDays ?? 14) * DAY;
    const expiringSoon = vouchers.find(
      (v) => v.redeemable && v.expiresAt - now < within && v.expiresAt > now,
    );
    if (expiringSoon) {
      const days = Math.max(1, Math.round((expiringSoon.expiresAt - now) / DAY));
      out.push({
        code: "voucher_expiring",
        label: "Voucher expiring",
        headline: `Voucher expires in ${days} d`,
        priority: 70,
      });
    }
  }

  if (config.large_booking.enabled && bookingSize !== null) {
    const threshold = config.large_booking.largeBookingSize ?? 8;
    if (bookingSize >= threshold) {
      out.push({
        code: "large_booking",
        label: `Party of ${bookingSize}`,
        headline: `Big booking — party of ${bookingSize}`,
        priority: 65,
      });
    }
  }

  out.sort((a, b) => b.priority - a.priority);
  return out;
}
