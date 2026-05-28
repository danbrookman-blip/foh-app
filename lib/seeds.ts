/**
 * Seed customers for the demo. These are the *people* in the world.
 * Airship and Toggle each have their own view of these people, joined on mobile/email.
 *
 * Five personas chosen to cover every demo branch in one walkthrough:
 *  - Sarah:  VIP with birthday this month + multiple entitlements (the headline lookup)
 *  - James:  At-risk lapsed regular with a recovery voucher (shows recovery flow)
 *  - Olivia: New customer with a welcome voucher (shows first-time path)
 *  - Ben:    Frequent regular with loyalty reward + small Toggle balance
 *  - Priya:  VIP with NO vouchers but a Toggle gift card (shows the empty-voucher UX honestly)
 */

const now = Date.now();
const DAY = 86_400_000;
const currentMonth = new Date().getMonth() + 1;

export type Tier = "new" | "regular" | "vip" | "at-risk" | "recovery";

export type SeedCustomer = {
  /** Internal demo id only — never returned by adapters. */
  ref: string;
  firstName: string;
  lastInitial: string;
  mobileE164: string;
  email: string;
  tier: Tier;
  joinedAt: number;
  lastVisitAt: number;
  visitsLast90Days: number;
  lifetimeVisits: number;
  favouriteCategory: string;
  lastItemOrdered: string;
  birthMonth: number;
  consentMarketing: boolean;
};

export const SEED_CUSTOMERS: SeedCustomer[] = [
  {
    ref: "c_sarah",
    firstName: "Sarah",
    lastInitial: "M",
    mobileE164: "+447700900001",
    email: "sarah.morley@example.com",
    tier: "vip",
    joinedAt: now - 720 * DAY,
    lastVisitAt: now - 3 * DAY,
    visitsLast90Days: 14,
    lifetimeVisits: 86,
    favouriteCategory: "Cocktails",
    lastItemOrdered: "Negroni",
    birthMonth: currentMonth,
    consentMarketing: true,
  },
  {
    ref: "c_james",
    firstName: "James",
    lastInitial: "K",
    mobileE164: "+447700900002",
    email: "j.kowalski@example.com",
    tier: "at-risk",
    joinedAt: now - 1100 * DAY,
    lastVisitAt: now - 78 * DAY,
    visitsLast90Days: 1,
    lifetimeVisits: 142,
    favouriteCategory: "Sunday lunch",
    lastItemOrdered: "Sunday roast",
    birthMonth: (currentMonth % 12) + 1,
    consentMarketing: true,
  },
  {
    ref: "c_olivia",
    firstName: "Olivia",
    lastInitial: "P",
    mobileE164: "+447700900003",
    email: "olivia.p@example.com",
    tier: "new",
    joinedAt: now - 6 * DAY,
    lastVisitAt: now - 4 * DAY,
    visitsLast90Days: 1,
    lifetimeVisits: 1,
    favouriteCategory: "Burgers",
    lastItemOrdered: "House burger",
    birthMonth: ((currentMonth + 4) % 12) + 1,
    consentMarketing: true,
  },
  {
    ref: "c_ben",
    firstName: "Ben",
    lastInitial: "T",
    mobileE164: "+447700900004",
    email: "ben.t@example.com",
    tier: "regular",
    joinedAt: now - 400 * DAY,
    lastVisitAt: now - 1 * DAY,
    visitsLast90Days: 22,
    lifetimeVisits: 71,
    favouriteCategory: "Cask ales",
    lastItemOrdered: "Guinness",
    birthMonth: ((currentMonth + 7) % 12) + 1,
    consentMarketing: true,
  },
  {
    ref: "c_priya",
    firstName: "Priya",
    lastInitial: "R",
    mobileE164: "+447700900005",
    email: "priya.r@example.com",
    tier: "vip",
    joinedAt: now - 900 * DAY,
    lastVisitAt: now - 11 * DAY,
    visitsLast90Days: 9,
    lifetimeVisits: 64,
    favouriteCategory: "Wine",
    lastItemOrdered: "Picpoul de Pinet",
    birthMonth: ((currentMonth + 2) % 12) + 1,
    consentMarketing: false,
  },
];

export function findSeedByIdentifier(
  kind: "mobile" | "email",
  value: string,
): SeedCustomer | null {
  if (kind === "mobile") {
    return SEED_CUSTOMERS.find((c) => c.mobileE164 === value) ?? null;
  }
  return SEED_CUSTOMERS.find((c) => c.email === value.toLowerCase()) ?? null;
}

export function findSeedByRef(ref: string): SeedCustomer | null {
  return SEED_CUSTOMERS.find((c) => c.ref === ref) ?? null;
}
