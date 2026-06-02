/**
 * Random Acts of Kindness — manager-issued treats that don't depend on a customer
 * being a registered loyalty member. Manager picks one, hands it over, till applies
 * it as a normal comp/discount. We track for monthly quotas + analytics.
 */

export type AwardCode =
  | "free_coffee"
  | "free_cake"
  | "free_side"
  | "free_cocktail"
  | "free_house_wine"
  | "free_main"
  | "fifty_off_bill"
  | "round_on_house";

export type KindnessAward = {
  code: AwardCode;
  name: string;
  description: string;
  /** Single character that renders well at small sizes. */
  icon: string;
  /** Per-venue monthly cap. */
  monthlyLimit: number;
};

export type KindnessCatalogEntry = KindnessAward & {
  /** Grants used this calendar month at the venue. */
  usedThisMonth: number;
  remaining: number;
};

export type KindnessGrant = {
  id: string;
  awardCode: AwardCode;
  /** Opaque customer ref if known. May be null for walk-ins (post-prototype). */
  customerRef: string | null;
  /** Human-readable recipient label. "Sarah M." for known, "Walk-in at table 7" otherwise. */
  recipientLabel: string;
  venueName: string;
  managerName: string;
  grantedAt: number;
};
