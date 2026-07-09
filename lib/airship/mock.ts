import { randomUUID } from "crypto";
import { findSeedByIdentifier, findSeedByRef, SEED_CUSTOMERS } from "@/lib/seeds";
import type { AirshipAdapter } from "./adapter";
import type { CustomerNote, CustomerSignals, LookupResult, Voucher } from "./types";

const DAY = 86_400_000;
const now = Date.now();

type StoredVoucher = Voucher & { customerRef: string };

const VOUCHERS: StoredVoucher[] = [
  // Sarah — VIP, birthday this month
  {
    id: "v_sarah_birthday",
    customerRef: "c_sarah",
    title: "Birthday treat",
    description: "£20 off your birthday meal — eat in, any food",
    value: "£20 off",
    type: "birthday",
    expiresAt: now + 21 * DAY,
    redeemable: true,
  },
  {
    id: "v_sarah_loyalty",
    customerRef: "c_sarah",
    title: "Free dessert",
    description: "Loyalty reward — your 80th visit, on us",
    value: "Free dessert",
    type: "loyalty",
    expiresAt: now + 60 * DAY,
    redeemable: true,
  },
  // James — at-risk recovery
  {
    id: "v_james_recovery",
    customerRef: "c_james",
    title: "We miss you",
    description: "Free starter on your next visit",
    value: "Free starter",
    type: "recovery",
    expiresAt: now + 30 * DAY,
    redeemable: true,
  },
  // Olivia — new welcome
  {
    id: "v_olivia_welcome",
    customerRef: "c_olivia",
    title: "Welcome",
    description: "Free coffee on your second visit",
    value: "Free coffee",
    type: "welcome",
    expiresAt: now + 90 * DAY,
    redeemable: true,
  },
  // Ben — loyalty reward
  {
    id: "v_ben_loyalty",
    customerRef: "c_ben",
    title: "On the house",
    description: "Loyalty reward — pick any pint",
    value: "Free pint",
    type: "loyalty",
    expiresAt: now + 45 * DAY,
    redeemable: true,
  },
  // Priya intentionally has none — exposes the empty-voucher UX in the demo.
];

const redeemedIds = new Set<string>();
const sentMessages: Array<{ customerRef: string; channel: string; body: unknown; at: number }> = [];

const NOTES: CustomerNote[] = [
  {
    id: "n_sarah_1",
    customerRef: "c_sarah",
    body: "Prefers a corner table if one's free. Husband (Tom) usually orders the ribeye, medium-rare.",
    authorName: "Alex Rivers",
    venueName: "Arcado",
    createdAt: now - 42 * DAY,
  },
  {
    id: "n_ben_1",
    customerRef: "c_ben",
    body: "Prefers booth 3 if free. Knows the cask rotation, happy to chat about it.",
    authorName: "Sam Patel",
    venueName: "Arcado",
    createdAt: now - 14 * DAY,
  },
  {
    id: "n_priya_1",
    customerRef: "c_priya",
    body: "Wine list knowledge — let her pick if she's undecided, she enjoys the conversation.",
    authorName: "Jordan Reed",
    venueName: "Argento",
    createdAt: now - 21 * DAY,
  },
  {
    id: "n_james_1",
    customerRef: "c_james",
    body: "Last visit had a kitchen delay, comp'd the starter. Worth a warm welcome and quick attention.",
    authorName: "Alex Rivers",
    venueName: "Arco",
    createdAt: now - 78 * DAY,
  },
];

const MAX_NOTE_LEN = 500;

function pause(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const airshipMock: AirshipAdapter = {
  async lookup(identifier) {
    await pause(350); // simulate API latency for the demo
    const seed = findSeedByIdentifier(identifier.kind, identifier.value);
    if (!seed) return { match: false };
    const vouchers = VOUCHERS.filter(
      (v) => v.customerRef === seed.ref && !redeemedIds.has(v.id),
    ).map(({ customerRef, ...v }) => v);
    return {
      match: true,
      customerRef: seed.ref,
      tierBucket: seed.tier,
      vouchers,
    };
  },

  async getVouchers(customerRef) {
    return VOUCHERS.filter(
      (v) => v.customerRef === customerRef && !redeemedIds.has(v.id),
    ).map(({ customerRef: _r, ...v }) => v);
  },

  async getSignals(customerRef) {
    const seed = findSeedByRef(customerRef);
    if (!seed) return null;
    const currentMonth = new Date().getMonth() + 1;
    const signals: CustomerSignals = {
      customerRef: seed.ref,
      displayName: `${seed.firstName} ${seed.lastInitial}.`,
      tier: seed.tier,
      lastVisitAt: seed.lastVisitAt,
      visitsLast90Days: seed.visitsLast90Days,
      lifetimeVisits: seed.lifetimeVisits,
      favouriteCategory: seed.favouriteCategory,
      lastItemOrdered: seed.lastItemOrdered,
      birthdayThisMonth: seed.birthMonth === currentMonth,
      anniversaryThisMonth: seed.anniversaryMonth === currentMonth,
    };
    return signals;
  },

  async registerCustomer(input) {
    const existing = SEED_CUSTOMERS.find(
      (c) =>
        c.mobileE164 === input.mobile ||
        c.email.toLowerCase() === input.email.toLowerCase(),
    );
    if (existing) return { ok: false, reason: "duplicate" };
    const ref = `c_new_${Date.now().toString(36)}`;
    SEED_CUSTOMERS.push({
      ref,
      firstName: input.firstName,
      lastInitial: input.lastName.charAt(0).toUpperCase(),
      mobileE164: input.mobile,
      email: input.email.toLowerCase(),
      tier: "new",
      joinedAt: Date.now(),
      lastVisitAt: Date.now(),
      visitsLast90Days: 1,
      lifetimeVisits: 1,
      favouriteCategory: "—",
      lastItemOrdered: "—",
      birthMonth: 0,
      consentMarketing: input.consentMarketing,
      insight: "Just registered — first visit. Make them feel welcome.",
    });
    return { ok: true, customerRef: ref };
  },

  async markVoucherRedeemed(customerRef, voucherId) {
    const voucher = VOUCHERS.find((v) => v.id === voucherId && v.customerRef === customerRef);
    if (!voucher) return { ok: false };
    redeemedIds.add(voucherId);
    return { ok: true };
  },

  async sendMessage(customerRef, channel, body) {
    sentMessages.push({ customerRef, channel, body, at: Date.now() });
    if (process.env.NODE_ENV !== "production") {
      console.log(`[airship-mock] ${channel} → ${customerRef}: ${body.text}`);
    }
    return { ok: true };
  },

  async getInsight(customerRef) {
    const seed = findSeedByRef(customerRef);
    return seed?.insight ?? null;
  },

  async getNotes(customerRef) {
    return NOTES.filter((n) => n.customerRef === customerRef).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  },

  async addNote(input) {
    const body = input.body.trim();
    if (!body) return { ok: false, reason: "empty" };
    if (body.length > MAX_NOTE_LEN) return { ok: false, reason: "too_long" };
    const note: CustomerNote = {
      id: `n_${randomUUID()}`,
      customerRef: input.customerRef,
      body,
      authorName: input.authorName,
      venueName: input.venueName,
      createdAt: Date.now(),
    };
    NOTES.unshift(note);
    return { ok: true, note };
  },
};

export function _mockSentMessages() {
  return sentMessages;
}
