import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { SEED_CUSTOMERS } from "@/lib/seeds";
import { DEFAULT_CRITERIA, evaluateArrival } from "@/lib/arrival-criteria";

/**
 * Simulated arrivals feed. In production this is fed by:
 *  - venue WiFi captive-portal sign-in
 *  - reservation system match (Sevenrooms, OpenTable webhook)
 *
 * Each arrival is evaluated against the criteria engine so the UI can render
 * pills for everything triggered, and so a demo trigger can fire pushes for the
 * same arrival without recomputing.
 */
export async function GET() {
  const order = ["c_sarah", "c_priya", "c_ben", "c_olivia", "c_james"];
  const bookingSizes: Record<string, number | null> = {
    c_sarah: null,
    c_priya: 2,
    c_ben: null,
    c_olivia: 4,
    c_james: 9, // triggers large_booking criterion
  };

  const arrivals = await Promise.all(
    order.map(async (ref, i) => {
      const signals = await airship.getSignals(ref);
      const seed = SEED_CUSTOMERS.find((c) => c.ref === ref);
      if (!signals || !seed) return null;
      const vouchers = await airship.getVouchers(ref);
      const bookingSize = bookingSizes[ref] ?? null;
      const triggered = evaluateArrival({
        signals,
        vouchers,
        bookingSize,
        config: DEFAULT_CRITERIA,
      });
      return {
        ...signals,
        arrivedAt: Date.now() - i * 4 * 60 * 1000,
        source: i % 2 === 0 ? "wifi" : "booking",
        bookingSize,
        triggered,
      };
    }),
  );
  return NextResponse.json({ arrivals: arrivals.filter(Boolean) });
}
