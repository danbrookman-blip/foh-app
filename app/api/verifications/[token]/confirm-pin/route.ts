import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { toggle } from "@/lib/toggle";
import { confirmWithPin, getVerification } from "@/lib/verification/store";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/session";

/**
 * V1.2 — PIN-readback fallback.
 *
 * Manager enters the 6-digit PIN read out by the customer. Used only when the
 * primary device-link flow fails (no signal in venue, customer's phone unavailable).
 *
 * Rate-limited to 5 attempts per token (handled in the store). The audit log flags
 * fallback_used = true so head office can monitor for abuse signals.
 */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { token } = await params;
  const body = (await req.json().catch(() => null)) as { pin?: string } | null;
  if (!body?.pin) return NextResponse.json({ error: "missing_pin" }, { status: 400 });

  const result = confirmWithPin(token, body.pin);
  if (!result.ok) {
    if (result.reason === "pin_wrong" || result.reason === "rate_limited") {
      const after = getVerification(token);
      await audit.append({
        action: "verification_confirmed_pin",
        outcome: "denied",
        operatorId: session.operatorId,
        venueId: session.venueId,
        staffId: session.staffId,
        sessionId: session.sessionId,
        identifierHash: after?.identifierHash,
        fallbackUsed: true,
        meta: { reason: result.reason, attempts: after?.pinAttempts ?? 0 },
      });
    }
    const status = result.reason === "rate_limited" ? 429 : result.reason === "pin_wrong" ? 401 : 410;
    return NextResponse.json({ error: result.reason }, { status });
  }

  const v = result.verification;

  await audit.append({
    action: "verification_confirmed_pin",
    outcome: "ok",
    operatorId: session.operatorId,
    venueId: session.venueId,
    staffId: session.staffId,
    sessionId: session.sessionId,
    identifierHash: v.identifierHash,
    fallbackUsed: true,
    meta: { itemCount: v.items.length },
  });

  for (const item of v.items) {
    if (item.kind === "voucher") {
      await airship.markVoucherRedeemed(v.customerRef, item.id);
    } else {
      await toggle.markGiftCardAuthorised(v.customerRef, item.id);
    }
    await audit.append({
      action: "redemption_logged",
      outcome: "ok",
      operatorId: session.operatorId,
      venueId: session.venueId,
      staffId: session.staffId,
      sessionId: session.sessionId,
      identifierHash: v.identifierHash,
      entitlementId: item.id,
      fallbackUsed: true,
      meta: { kind: item.kind },
    });
  }

  return NextResponse.json({ status: v.status, confirmedAt: v.confirmedAt, fallbackUsed: true });
}
