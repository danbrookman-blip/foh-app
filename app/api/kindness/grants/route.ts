import { NextResponse } from "next/server";
import { kindness } from "@/lib/kindness";
import { getSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import type { AwardCode } from "@/lib/kindness/types";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    awardCode?: AwardCode;
    customerRef?: string | null;
    recipientLabel?: string;
  } | null;

  if (!body?.awardCode || !body.recipientLabel) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = await kindness.grant({
    awardCode: body.awardCode,
    customerRef: body.customerRef ?? null,
    recipientLabel: body.recipientLabel,
    venueName: session.venueName,
    managerName: session.managerName,
  });

  if (!result.ok) {
    await audit.append({
      action: "kindness_granted",
      outcome: result.reason === "quota_exhausted" ? "conflict" : "denied",
      operatorId: session.operatorId,
      venueId: session.venueId,
      staffId: session.staffId,
      sessionId: session.sessionId,
      meta: { awardCode: body.awardCode, reason: result.reason },
    });
    const status = result.reason === "unknown_award" ? 400 : 409;
    return NextResponse.json({ error: result.reason }, { status });
  }

  await audit.append({
    action: "kindness_granted",
    outcome: "ok",
    operatorId: session.operatorId,
    venueId: session.venueId,
    staffId: session.staffId,
    sessionId: session.sessionId,
    meta: {
      awardCode: body.awardCode,
      grantId: result.grant.id,
      knownCustomer: body.customerRef !== null && body.customerRef !== undefined,
    },
  });

  return NextResponse.json({ grant: result.grant }, { status: 201 });
}
