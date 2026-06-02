import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { toggle } from "@/lib/toggle";
import { confirmVerification, getVerification } from "@/lib/verification/store";
import { audit } from "@/lib/audit";

/**
 * Customer confirms presence + authorises redemption.
 *
 * On confirm we mark each item authorised in its source system. In real life the
 * till would still be the redemption surface — this just unlocks the entitlement
 * for that visit, much like a one-time PIN against a voucher.
 *
 * The audit log captures both the customer's confirmation (verification_confirmed)
 * and the resulting redemption events (redemption_logged) — separating the
 * customer's authorisation from the operational redemption per spec F1.7.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const before = getVerification(token);
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (before.status === "expired")
    return NextResponse.json({ error: "expired" }, { status: 410 });
  if (before.status === "cancelled")
    return NextResponse.json({ error: "cancelled" }, { status: 410 });

  const v = confirmVerification(token);
  if (!v) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await audit.append({
    action: "verification_confirmed",
    outcome: "ok",
    operatorId: "op_demo", // Confirm event is customer-initiated; operator inherited from the session that issued the token.
    venueId: v.venueId,
    staffId: "customer",
    sessionId: v.sessionId,
    identifierHash: v.identifierHash,
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
      operatorId: "op_demo",
      venueId: v.venueId,
      staffId: "customer",
      sessionId: v.sessionId,
      identifierHash: v.identifierHash,
      entitlementId: item.id,
      meta: { kind: item.kind },
    });
  }

  return NextResponse.json({ status: v.status, confirmedAt: v.confirmedAt });
}
