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
  /** Month (1-12) of a wedding/relationship or membership anniversary, if known. */
  anniversaryMonth?: number;
  consentMarketing: boolean;
  /**
   * Strava-style observational snippet — a single sentence the floor server can
   * read in 3 seconds and act on. Warm, specific, slightly clever; distinct from
   * deterministic signals (recency/frequency) and from manager-authored notes.
   *
   * In production this comes from aggregated visit patterns + ML; here it's
   * mocked per persona for demo richness.
   */
  insight: string;
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
    insight:
      "Negroni first, always. Comes with husband Tom — he goes for the ribeye, medium-rare. Likes a quiet table away from the bar.",
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
    insight:
      "Sunday roast person — 12 in the last year. Last visit was rocky, kitchen delay, comp'd starter. Warm welcome worth it.",
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
    insight:
      "First visit four days ago. Tried the house burger, told staff it was the best she'd had in Soho. Worth a follow-up.",
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
    insight:
      "Booth 3 if it's free. Knows the cask rotation inside out — happy to chat about what's on. Two or three pints, never more.",
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
    anniversaryMonth: currentMonth,
    consentMarketing: false,
    insight:
      "Wine list expert — Picpoul is the usual. Enjoys talking through the list; let her pick if she's undecided. Quiet table, please.",
  },
  {
    ref: "c_grace",
    firstName: "Grace",
    lastInitial: "C",
    mobileE164: "+447700900006",
    email: "grace.chen@example.com",
    tier: "regular",
    joinedAt: now - 300 * DAY,
    lastVisitAt: now - 6 * DAY,
    visitsLast90Days: 8,
    lifetimeVisits: 41,
    favouriteCategory: "Wine",
    lastItemOrdered: "Sancerre",
    birthMonth: ((currentMonth + 3) % 12) + 1,
    anniversaryMonth: currentMonth,
    consentMarketing: true,
    insight:
      "Books the window two-top most Fridays after work. A glass of Sancerre to start, then whatever the fish special is.",
  },
  {
    ref: "c_marco",
    firstName: "Marco",
    lastInitial: "V",
    mobileE164: "+447700900007",
    email: "marco.v@example.com",
    tier: "vip",
    joinedAt: now - 640 * DAY,
    lastVisitAt: now - 9 * DAY,
    visitsLast90Days: 12,
    lifetimeVisits: 58,
    favouriteCategory: "Steak",
    lastItemOrdered: "Ribeye",
    birthMonth: currentMonth,
    consentMarketing: true,
    insight:
      "Celebrating a birthday tonight, party of six. Big spender on the wine list, likes the kitchen to send something to start.",
  },
  {
    ref: "c_amara",
    firstName: "Amara",
    lastInitial: "O",
    mobileE164: "+447700900008",
    email: "amara.o@example.com",
    tier: "new",
    joinedAt: now - 9 * DAY,
    lastVisitAt: now - 9 * DAY,
    visitsLast90Days: 1,
    lifetimeVisits: 1,
    favouriteCategory: "Small plates",
    lastItemOrdered: "Padron peppers",
    birthMonth: ((currentMonth + 5) % 12) + 1,
    consentMarketing: true,
    insight:
      "Second ever visit, booked for three. First time she came in on a friend's recommendation, so word of mouth is working.",
  },
  {
    ref: "c_dev",
    firstName: "Dev",
    lastInitial: "S",
    mobileE164: "+447700900009",
    email: "dev.s@example.com",
    tier: "regular",
    joinedAt: now - 520 * DAY,
    lastVisitAt: now - 4 * DAY,
    visitsLast90Days: 16,
    lifetimeVisits: 63,
    favouriteCategory: "Cocktails",
    lastItemOrdered: "Old Fashioned",
    birthMonth: ((currentMonth + 8) % 12) + 1,
    consentMarketing: true,
    insight:
      "Regular date-night booking with his partner. Starts with an Old Fashioned every time, no need to hand him the drinks list.",
  },
  {
    ref: "c_holly",
    firstName: "Holly",
    lastInitial: "W",
    mobileE164: "+447700900010",
    email: "holly.w@example.com",
    tier: "at-risk",
    joinedAt: now - 800 * DAY,
    lastVisitAt: now - 64 * DAY,
    visitsLast90Days: 1,
    lifetimeVisits: 39,
    favouriteCategory: "Sunday lunch",
    lastItemOrdered: "Roast chicken",
    birthMonth: ((currentMonth + 6) % 12) + 1,
    consentMarketing: true,
    insight:
      "Used to be in every fortnight, quiet for two months now. Booked for four tonight, so this is a good chance to win her back.",
  },
  {
    ref: "c_theo",
    firstName: "Theo",
    lastInitial: "B",
    mobileE164: "+447700900011",
    email: "theo.b@example.com",
    tier: "vip",
    joinedAt: now - 970 * DAY,
    lastVisitAt: now - 5 * DAY,
    visitsLast90Days: 18,
    lifetimeVisits: 112,
    favouriteCategory: "Tasting menu",
    lastItemOrdered: "Chef's tasting menu",
    birthMonth: ((currentMonth + 1) % 12) + 1,
    consentMarketing: true,
    insight:
      "Brings clients in for the tasting menu, party of eight tonight. Trusts the kitchen completely, just needs the pace kept relaxed.",
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
