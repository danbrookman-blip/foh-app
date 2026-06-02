import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { airship } from "@/lib/airship";
import { DEFAULT_CRITERIA, evaluateArrival } from "@/lib/arrival-criteria";
import { audit } from "@/lib/audit";
import {
  buildPayload,
  findRecipients,
  sendPush,
} from "@/lib/push";

/**
 * Demo trigger — simulates an arrival event from the booking / WiFi adapter and
 * runs the criteria engine + push delivery end-to-end.
 *
 * In production this endpoint is called by the arrival source (booking webhook,
 * WiFi captive-portal callback) — not the manager. For the demo, it's manually
 * triggered from the Arrivals page so a presenter can fire pings on demand.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | { customerRef?: string; bookingSize?: number | null }
    | null;
  if (!body?.customerRef) {
    return NextResponse.json({ error: "missing_customerRef" }, { status: 400 });
  }

  const signals = await airship.getSignals(body.customerRef);
  if (!signals) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const vouchers = await airship.getVouchers(body.customerRef);

  const triggered = evaluateArrival({
    signals,
    vouchers,
    bookingSize: body.bookingSize ?? null,
    config: DEFAULT_CRITERIA,
  });

  if (triggered.length === 0) {
    return NextResponse.json({ triggered: [], pushed: 0, reason: "no_criteria_met" });
  }

  const recipients = findRecipients({
    operatorId: session.operatorId,
    venueId: session.venueId,
    triggeredCriteria: triggered.map((t) => t.code),
  });

  const payload = buildPayload({
    customerRef: body.customerRef,
    signals,
    triggered,
  });

  const results = await Promise.all(recipients.map((r) => sendPush(r, payload)));
  const pushed = results.filter((r) => r.ok).length;
  const failed = results.length - pushed;

  await audit.append({
    action: "signal_viewed",
    outcome: "ok",
    operatorId: session.operatorId,
    venueId: session.venueId,
    staffId: session.staffId,
    sessionId: session.sessionId,
    meta: {
      trigger: "demo",
      triggeredCount: triggered.length,
      pushed,
      failed,
      criteria: triggered.map((t) => t.code).join(","),
    },
  });

  return NextResponse.json({
    triggered,
    pushed,
    failed,
    recipientCount: recipients.length,
  });
}
