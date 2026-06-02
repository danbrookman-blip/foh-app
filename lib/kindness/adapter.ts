import type { AwardCode, KindnessCatalogEntry, KindnessGrant } from "./types";

/**
 * KindnessAdapter — separated from AirshipAdapter because these are venue-side
 * manager actions, not Airship loyalty entitlements. Production wiring is likely
 * your own service (or Airship's promotions API if they expose one).
 *
 * Swap: implement against the real backing store in `lib/kindness/kindness-client.ts`
 * and re-export from `lib/kindness/index.ts`. UI imports only from there.
 */
export interface KindnessAdapter {
  /** Catalog with live quota for the active venue. */
  getCatalog(venueName: string): Promise<KindnessCatalogEntry[]>;

  /** Recent grants attached to a customer — shown on their profile so the
   *  manager doesn't pile on. Newest first. */
  getRecentForCustomer(customerRef: string, limit?: number): Promise<KindnessGrant[]>;

  /** Issue a grant. Returns the recorded grant or a reason it couldn't be issued. */
  grant(input: {
    awardCode: AwardCode;
    customerRef: string | null;
    recipientLabel: string;
    venueName: string;
    managerName: string;
  }): Promise<
    | { ok: true; grant: KindnessGrant }
    | { ok: false; reason: "unknown_award" | "quota_exhausted" }
  >;
}
