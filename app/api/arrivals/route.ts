import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { SEED_CUSTOMERS } from "@/lib/seeds";

/**
 * Simulated arrivals feed. In production this is fed by:
 *  - venue WiFi captive-portal sign-in (returns customer identifier)
 *  - reservation system match (Sevenrooms, OpenTable webhook)
 *
 * Mock: returns a rolling 4-arrival window, refreshed each call, so the demo feels
 * alive without needing a real-time event source. Sarah surfaces first because the
 * birthday + VIP combo is the most compelling moment to demo.
 */
export async function GET() {
  const order = ["c_sarah", "c_priya", "c_ben", "c_olivia", "c_james"];
  const arrivals = await Promise.all(
    order.map(async (ref, i) => {
      const signals = await airship.getSignals(ref);
      const seed = SEED_CUSTOMERS.find((c) => c.ref === ref);
      if (!signals || !seed) return null;
      return {
        ...signals,
        arrivedAt: Date.now() - i * 4 * 60 * 1000,
        source: i % 2 === 0 ? "wifi" : "booking",
      };
    }),
  );
  return NextResponse.json({ arrivals: arrivals.filter(Boolean) });
}
