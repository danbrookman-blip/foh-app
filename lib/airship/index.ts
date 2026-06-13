import { airshipMock } from "./mock";
import {
  airshipContactToRef,
  fetchAirshipContact,
  isAirshipConfigured,
} from "./airship-client";
import type { AirshipAdapter } from "./adapter";

/**
 * Composite Airship adapter.
 *
 * Lookup behaviour:
 *  1. Try the mock first — preserves the seeded demo personas (07700 900 001–005)
 *     so the demo walkthrough doesn't depend on real-API state.
 *  2. If no mock match AND env vars are configured, fall through to the real
 *     Airship public API. A match returns a customer ref prefixed `airship_` and
 *     empty entitlements — the public API doesn't expose voucher-per-contact, so
 *     the results page honestly lands on "No entitlements found" for these.
 *  3. Otherwise return no match.
 *
 * Every other method (getVouchers, getNotes, registerCustomer, sendMessage, etc.)
 * still goes through the mock. None of those are in the public API surface — see
 * the handover plan's pre-build gotchas G1.1–G1.3.
 */
const composite: AirshipAdapter = {
  ...airshipMock,

  async lookup(identifier) {
    const mockResult = await airshipMock.lookup(identifier);
    if (mockResult.match) return mockResult;

    if (isAirshipConfigured()) {
      const contact = await fetchAirshipContact(identifier);
      if (contact) {
        return {
          match: true,
          customerRef: airshipContactToRef(contact),
          tierBucket: "regular",
          vouchers: [],
        };
      }
    }

    return { match: false };
  },
};

export const airship: AirshipAdapter = composite;

export type { AirshipAdapter };
export * from "./types";
