import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { DEFAULT_CRITERIA, evaluateArrival } from "@/lib/arrival-criteria";
import type { CustomerSignals } from "@/lib/airship/types";

/**
 * Simulated arrivals feed. In production this is fed by:
 *  - venue WiFi captive-portal sign-in (real-time arrivals)
 *  - reservation system match (both real-time arrivals and confirmed bookings
 *    for later in the day)
 *
 * Each row carries a `kind`:
 *  - "arrived": they're already in the venue. `at` is the timestamp they showed up.
 *  - "booking": confirmed reservation for later today. `at` is the booking time.
 *
 * The criteria engine runs against both so the manager can see *which* incoming
 * guests warrant a heads-up before they walk through the door.
 *
 * A real service does 50–60 covers a night, so this route deliberately emits a
 * busy board: a handful of richly-seeded "hero" guests (full profile, insight,
 * notes, kindness) plus a generated crowd that fills out the time slots. Every
 * booking time is quantised to a 30-minute slot and computed from "now", so the
 * board always reads as a forthcoming evening whenever the demo runs.
 */

const MIN = 60_000;
const SLOT_MS = 30 * MIN;

/** Timestamp of dinner slot `index`, starting at the next half-hour ≥30 min out. */
function slotTime(index: number): number {
  const d = new Date(Date.now() + 30 * MIN);
  const m = d.getMinutes();
  d.setMinutes(m < 30 ? 30 : 60, 0, 0); // round up to the next :00 / :30
  return d.getTime() + index * SLOT_MS;
}

// --- Hero guests: already in the venue, resolved from the seed personas. -----
type HeroArrival = { ref: string; at: number; source: "wifi" | "booking"; bookingSize: number | null };

const ARRIVED: HeroArrival[] = [
  { ref: "c_sarah", at: Date.now() - 4 * MIN, source: "wifi", bookingSize: null },
  { ref: "c_priya", at: Date.now() - 18 * MIN, source: "booking", bookingSize: 2 },
  { ref: "c_ben", at: Date.now() - 32 * MIN, source: "wifi", bookingSize: null },
];

// --- Hero bookings: full-profile guests spread across the evening slots. ------
const BOOKING_HEROES: Array<{ ref: string; slot: number; size: number }> = [
  { ref: "c_grace", slot: 0, size: 2 },
  { ref: "c_olivia", slot: 1, size: 4 },
  { ref: "c_dev", slot: 2, size: 2 },
  { ref: "c_amara", slot: 3, size: 3 },
  { ref: "c_holly", slot: 4, size: 4 },
  { ref: "c_james", slot: 5, size: 9 },
  { ref: "c_marco", slot: 6, size: 6 },
  { ref: "c_theo", slot: 8, size: 8 },
];

// --- Generated crowd: lighter-weight bookings that fill the board. -----------
const FIRST_NAMES = [
  "Tom", "Aisha", "Liam", "Sofia", "Noah", "Mia", "Ethan", "Zara", "Lucas", "Chloe",
  "Adam", "Nadia", "Ryan", "Freya", "Omar", "Ivy", "Jack", "Leah", "Sam", "Nia",
  "Rory", "Elena", "Cole", "Yusuf", "Beth", "Kai", "Anya", "Josh", "Maya", "Reed",
  "Isla", "Dan", "Rosa", "Finn", "Tara", "Neil",
];
const LAST_INITIALS = "SBTMKRWLPCDHGNVA";
const TIER_CYCLE = ["regular", "new", "vip", "regular", "at-risk", "new", "regular", "vip"] as const;
const OCCASION_CYCLE = ["", "birthday", "", "anniversary", "", "", "birthday", "", "anniversary", ""] as const;
const PARTY_CYCLE = [2, 2, 4, 2, 6, 3, 2, 8, 4, 2, 5, 2, 10, 3];

// How many generated bookings land in each 30-min slot — a believable dinner curve.
const PER_SLOT = [2, 3, 4, 5, 5, 6, 5, 4, 3, 2];

type Generated = {
  ref: string;
  name: string;
  tier: CustomerSignals["tier"];
  at: number;
  size: number;
  birthday: boolean;
  anniversary: boolean;
};

function buildGenerated(): Generated[] {
  const out: Generated[] = [];
  let n = 0;
  for (let slot = 0; slot < PER_SLOT.length; slot++) {
    for (let k = 0; k < PER_SLOT[slot]; k++) {
      const first = FIRST_NAMES[n % FIRST_NAMES.length];
      const initial = LAST_INITIALS[n % LAST_INITIALS.length];
      const tier = TIER_CYCLE[n % TIER_CYCLE.length];
      const occasion = OCCASION_CYCLE[n % OCCASION_CYCLE.length];
      out.push({
        ref: `c_gen_${n}`,
        name: `${first} ${initial}.`,
        tier,
        at: slotTime(slot),
        size: PARTY_CYCLE[n % PARTY_CYCLE.length],
        birthday: occasion === "birthday",
        anniversary: occasion === "anniversary",
      });
      n++;
    }
  }
  return out;
}

/** Synthesise a signal profile for a generated guest, shaped by their tier. */
function generatedSignals(g: Generated): CustomerSignals {
  const DAY = 86_400_000;
  const now = Date.now();
  const byTier: Record<CustomerSignals["tier"], { last: number; d90: number; life: number; cat: string; item: string }> = {
    vip: { last: now - 9 * DAY, d90: 11, life: 62, cat: "Wine", item: "Chablis" },
    regular: { last: now - 7 * DAY, d90: 9, life: 38, cat: "Cocktails", item: "Margarita" },
    new: { last: now - 5 * DAY, d90: 1, life: 1, cat: "Small plates", item: "Bread & olives" },
    "at-risk": { last: now - 72 * DAY, d90: 1, life: 44, cat: "Sunday lunch", item: "Roast" },
    recovery: { last: now - 50 * DAY, d90: 2, life: 29, cat: "Steak", item: "Sirloin" },
  };
  const t = byTier[g.tier];
  return {
    customerRef: g.ref,
    displayName: g.name,
    tier: g.tier,
    lastVisitAt: t.last,
    visitsLast90Days: t.d90,
    lifetimeVisits: t.life,
    favouriteCategory: t.cat,
    lastItemOrdered: t.item,
    birthdayThisMonth: g.birthday,
    anniversaryThisMonth: g.anniversary,
  };
}

export async function GET() {
  // Hero rows — resolved from the seed personas via the Airship adapter.
  const heroFeed = [
    ...ARRIVED.map((a) => ({ ...a, kind: "arrived" as const })),
    ...BOOKING_HEROES.map((b) => ({
      ref: b.ref,
      at: slotTime(b.slot),
      source: "booking" as const,
      bookingSize: b.size,
      kind: "booking" as const,
    })),
  ];

  const heroes = await Promise.all(
    heroFeed.map(async (f) => {
      const [signals, vouchers, insight] = await Promise.all([
        airship.getSignals(f.ref),
        airship.getVouchers(f.ref),
        airship.getInsight(f.ref),
      ]);
      if (!signals) return null;
      const triggered = evaluateArrival({
        signals,
        vouchers,
        bookingSize: f.kind === "booking" ? f.bookingSize : null,
        config: DEFAULT_CRITERIA,
      });
      return {
        ...signals,
        kind: f.kind,
        at: f.at,
        arrivedAt: f.at,
        source: f.source,
        bookingSize: "bookingSize" in f ? f.bookingSize : null,
        triggered,
        insight: insight ?? undefined,
      };
    }),
  );

  // Generated crowd — synthesised, no vouchers/insight, criteria still evaluated.
  const generated = buildGenerated().map((g) => {
    const signals = generatedSignals(g);
    const triggered = evaluateArrival({
      signals,
      vouchers: [],
      bookingSize: g.size,
      config: DEFAULT_CRITERIA,
    });
    return {
      ...signals,
      kind: "booking" as const,
      at: g.at,
      arrivedAt: g.at,
      source: "booking" as const,
      bookingSize: g.size,
      triggered,
      insight: undefined,
    };
  });

  const arrivals = [...heroes.filter((i): i is NonNullable<typeof i> => i !== null), ...generated].sort(
    (a, b) => {
      // Arrived rows first (most recent first), then bookings (soonest first).
      if (a.kind !== b.kind) return a.kind === "arrived" ? -1 : 1;
      return a.kind === "arrived" ? b.at - a.at : a.at - b.at;
    },
  );

  return NextResponse.json({ arrivals });
}
