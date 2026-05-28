import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { toggle } from "@/lib/toggle";
import { parseIdentifier } from "@/lib/identifiers";

/**
 * Manager lookup. Joins Airship vouchers + Toggle gift cards on a single identifier.
 *
 * Response intentionally contains NO PII: no name, no contact details. The caller
 * (the manager UI) gets entitlements + an opaque ref. Verification is required to
 * actually act on anything.
 *
 * In production: a customer-resolution step may be needed if Airship and Toggle
 * don't share a customer id. The mock uses mobile/email as the natural join.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { identifier?: string } | null;
  if (!body?.identifier) {
    return NextResponse.json({ error: "missing_identifier" }, { status: 400 });
  }
  const parsed = parseIdentifier(body.identifier);
  if (!parsed) {
    return NextResponse.json({ error: "invalid_identifier" }, { status: 400 });
  }

  const [airshipResult, toggleResult] = await Promise.all([
    airship.lookup(parsed),
    toggle.lookup(parsed),
  ]);

  if (!airshipResult.match && (!toggleResult.match || toggleResult.giftCards.length === 0)) {
    return NextResponse.json({ match: false });
  }

  const customerRef = airshipResult.match
    ? airshipResult.customerRef
    : toggleResult.match
    ? toggleResult.toggleRef
    : null;

  return NextResponse.json({
    match: true,
    customerRef,
    identifierKind: parsed.kind,
    vouchers: airshipResult.match ? airshipResult.vouchers : [],
    giftCards: toggleResult.match ? toggleResult.giftCards : [],
  });
}
