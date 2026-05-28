import type { GiftCardLookupResult } from "./types";

/**
 * ToggleAdapter — gift card platform.
 *
 * Swap target: implement against the real Toggle API and re-export from
 * `lib/toggle/index.ts`. UI is isolated from the change.
 *
 * Note on identity: in production, Airship and Toggle may not share a customer id.
 * The join key in this mock is mobile + email. Real wiring may need a customer
 * resolution step — left as a clearly-marked TODO in the lookup route.
 */
import type { GiftCard } from "./types";

export interface ToggleAdapter {
  lookup(identifier: { kind: "mobile" | "email"; value: string }): Promise<GiftCardLookupResult>;
  getGiftCards(toggleRef: string): Promise<GiftCard[]>;
  markGiftCardAuthorised(toggleRef: string, giftCardId: string): Promise<{ ok: boolean }>;
}
