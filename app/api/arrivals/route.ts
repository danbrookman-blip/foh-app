import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { DEFAULT_CRITERIA, evaluateArrival } from "@/lib/arrival-criteria";

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
 */

type FeedItem = {
  ref: string;
  kind: "arrived" | "booking";
  at: number;
  source: "wifi" | "booking";
  bookingSize: number | null;
};

/**
 * A booking slot `minutesFromNow` ahead, rounded down to the nearest quarter
 * hour so it reads like a real reservation time (19:30, not 19:37). Computing
 * from "now" keeps every booking genuinely forthcoming whenever the demo runs.
 */
function slot(minutesFromNow: number): number {
  const d = new Date(Date.now() + minutesFromNow * 60_000);
  d.setMinutes(d.getMinutes() - (d.getMinutes() % 15), 0, 0);
  return d.getTime();
}

export async function GET() {
  const now = Date.now();
  const MIN = 60_000;

  const FEED: FeedItem[] = [
    // Currently in the venue
    { ref: "c_sarah", kind: "arrived", at: now - 4 * MIN, source: "wifi", bookingSize: null },
    { ref: "c_priya", kind: "arrived", at: now - 18 * MIN, source: "booking", bookingSize: 2 },
    { ref: "c_ben", kind: "arrived", at: now - 32 * MIN, source: "wifi", bookingSize: null },
    // Coming later today — confirmed reservations across the evening
    { ref: "c_grace", kind: "booking", at: slot(40), source: "booking", bookingSize: 2 },
    { ref: "c_olivia", kind: "booking", at: slot(75), source: "booking", bookingSize: 4 },
    { ref: "c_dev", kind: "booking", at: slot(110), source: "booking", bookingSize: 2 },
    { ref: "c_amara", kind: "booking", at: slot(145), source: "booking", bookingSize: 3 },
    { ref: "c_holly", kind: "booking", at: slot(180), source: "booking", bookingSize: 4 },
    { ref: "c_james", kind: "booking", at: slot(215), source: "booking", bookingSize: 9 },
    { ref: "c_marco", kind: "booking", at: slot(250), source: "booking", bookingSize: 6 },
    { ref: "c_theo", kind: "booking", at: slot(300), source: "booking", bookingSize: 8 },
  ];

  // Anything booked in the past (i.e. their booking has already started but they
  // haven't checked in yet) falls back to the bottom of the future-bookings list.
  const items = await Promise.all(
    FEED.map(async (f) => {
      const [signals, vouchers, insight] = await Promise.all([
        airship.getSignals(f.ref),
        airship.getVouchers(f.ref),
        airship.getInsight(f.ref),
      ]);
      if (!signals) return null;
      const triggered = evaluateArrival({
        signals,
        vouchers,
        bookingSize: f.bookingSize,
        config: DEFAULT_CRITERIA,
      });
      return {
        ...signals,
        kind: f.kind,
        at: f.at,
        // Keep arrivedAt for backwards compatibility with downstream code that
        // still expects it (e.g. the Trigger arrival demo control).
        arrivedAt: f.at,
        source: f.source,
        bookingSize: f.bookingSize,
        triggered,
        insight: insight ?? undefined,
      };
    }),
  );

  const arrivals = items
    .filter((i): i is NonNullable<typeof i> => i !== null)
    .sort((a, b) => {
      // Arrived rows first (most recent first), then bookings (soonest first).
      if (a.kind !== b.kind) return a.kind === "arrived" ? -1 : 1;
      return a.kind === "arrived" ? b.at - a.at : a.at - b.at;
    });

  return NextResponse.json({ arrivals });
}
