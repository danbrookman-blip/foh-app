import type {
  CustomerSignals,
  LookupResult,
  RegisterCustomerInput,
  RegisterCustomerResult,
} from "./types";

/**
 * AirshipAdapter — every concrete implementation (mock or real) implements this.
 *
 * Swap target: when wiring the real Airship API, write a new file
 * `lib/airship/airship-client.ts` that implements this interface, then change
 * `lib/airship/index.ts` to export that instead of the mock. No UI changes.
 */
import type { Voucher } from "./types";

export interface AirshipAdapter {
  lookup(identifier: { kind: "mobile" | "email"; value: string }): Promise<LookupResult>;
  /** Fetch the live redeemable vouchers for a customer by their opaque ref. */
  getVouchers(customerRef: string): Promise<Voucher[]>;
  getSignals(customerRef: string): Promise<CustomerSignals | null>;
  registerCustomer(input: RegisterCustomerInput): Promise<RegisterCustomerResult>;
  /** Issued when a customer confirms redemption — Airship's voucher state machine in real life. */
  markVoucherRedeemed(customerRef: string, voucherId: string): Promise<{ ok: boolean }>;
  /** Mocked channel send. Real impl calls Airship messaging API. */
  sendMessage(
    customerRef: string,
    channel: "sms" | "email",
    body: { subject?: string; text: string },
  ): Promise<{ ok: boolean }>;
}
