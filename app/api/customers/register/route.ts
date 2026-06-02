import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { normaliseEmail, normaliseMobile } from "@/lib/identifiers";
import { audit, hashIdentifier } from "@/lib/audit";
import { getSession } from "@/lib/session";

/**
 * Phase 2 — new-guest capture. Prototype shortcoming flagged in handover-plan:
 *
 *  - Spec F2.4: the guest must acknowledge a just-in-time data-processing notice
 *    on their own device before the contact is created. The prototype skips that
 *    second step; the manager-side form alone creates the record. Wiring the
 *    second-device consent loop reuses the verification primitive — see
 *    docs/handover-plan.md F2.4.
 *
 *  - Spec F2.6: consent and acknowledgement events should be audit-logged. The
 *    prototype logs the "customer_registered" event but not the upstream consent
 *    acknowledgement (since that step doesn't exist yet).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | {
        firstName?: string;
        lastName?: string;
        mobile?: string;
        email?: string;
        consentMarketing?: boolean;
      }
    | null;

  if (!body?.firstName || !body.lastName || !body.mobile || !body.email) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const mobile = normaliseMobile(body.mobile);
  const email = normaliseEmail(body.email);
  if (!mobile || !email) {
    return NextResponse.json({ error: "invalid_contact" }, { status: 400 });
  }

  const result = await airship.registerCustomer({
    firstName: body.firstName.trim(),
    lastName: body.lastName.trim(),
    mobile,
    email,
    consentMarketing: !!body.consentMarketing,
  });

  if (!result.ok) {
    await audit.append({
      action: "customer_registered",
      outcome: "denied",
      operatorId: session.operatorId,
      venueId: session.venueId,
      staffId: session.staffId,
      sessionId: session.sessionId,
      identifierHash: hashIdentifier(mobile),
      meta: { reason: result.reason },
    });
    return NextResponse.json({ error: result.reason }, { status: 409 });
  }

  await audit.append({
    action: "customer_registered",
    outcome: "ok",
    operatorId: session.operatorId,
    venueId: session.venueId,
    staffId: session.staffId,
    sessionId: session.sessionId,
    identifierHash: hashIdentifier(mobile),
    meta: { consentMarketing: !!body.consentMarketing },
  });

  return NextResponse.json({ ok: true, customerRef: result.customerRef });
}
