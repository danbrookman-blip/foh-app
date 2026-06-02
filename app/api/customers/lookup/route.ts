import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { toggle } from "@/lib/toggle";
import { parseIdentifier } from "@/lib/identifiers";
import { audit, hashIdentifier } from "@/lib/audit";
import { getSession } from "@/lib/session";

/**
 * Manager lookup. Joins Airship vouchers + Toggle gift cards on a single identifier.
 *
 * Response intentionally contains NO PII: no name, no contact details. The caller
 * (the manager UI) gets entitlements + an opaque ref.
 *
 * Spec:
 *  - F1.2 — unified entitlement lookup, no PII
 *  - F1.3 — "no entitlements found" wording; never "guest not in system"
 *  - L1.2 — every lookup is audit-logged with hashed identifier
 *  - P1.4 — identifier hashing in logs
 *
 * Returns identifierKind so the caller can lock the verification channel later (V1.4).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { identifier?: string } | null;
  if (!body?.identifier) {
    return NextResponse.json({ error: "missing_identifier" }, { status: 400 });
  }
  const parsed = parseIdentifier(body.identifier);
  if (!parsed) {
    return NextResponse.json({ error: "invalid_identifier" }, { status: 400 });
  }

  const identifierHash = hashIdentifier(parsed.value);

  const [airshipResult, toggleResult] = await Promise.all([
    airship.lookup(parsed),
    toggle.lookup(parsed),
  ]);

  const hasVouchers = airshipResult.match && airshipResult.vouchers.length > 0;
  const hasGifts = toggleResult.match && toggleResult.giftCards.length > 0;

  if (!hasVouchers && !hasGifts) {
    await audit.append({
      action: "lookup_no_match",
      outcome: "ok",
      operatorId: session.operatorId,
      venueId: session.venueId,
      staffId: session.staffId,
      sessionId: session.sessionId,
      identifierHash,
      meta: { identifierKind: parsed.kind },
    });
    // F1.3: never leak whether the identifier exists. "No entitlements found" — never
    // "guest not in system."
    return NextResponse.json({ match: false });
  }

  const customerRef = airshipResult.match
    ? airshipResult.customerRef
    : toggleResult.match
    ? toggleResult.toggleRef
    : null;

  await audit.append({
    action: "lookup",
    outcome: "ok",
    operatorId: session.operatorId,
    venueId: session.venueId,
    staffId: session.staffId,
    sessionId: session.sessionId,
    identifierHash,
    meta: {
      identifierKind: parsed.kind,
      voucherCount: airshipResult.match ? airshipResult.vouchers.length : 0,
      giftCardCount: toggleResult.match ? toggleResult.giftCards.length : 0,
    },
  });

  return NextResponse.json({
    match: true,
    customerRef,
    identifierKind: parsed.kind,
    identifierHash,
    vouchers: airshipResult.match ? airshipResult.vouchers : [],
    giftCards: toggleResult.match ? toggleResult.giftCards : [],
  });
}
