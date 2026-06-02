import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { audit, hashIdentifier } from "@/lib/audit";
import { createVerification, type VerificationItem } from "@/lib/verification/store";
import { getSession } from "@/lib/session";

/**
 * Manager triggers a verification send.
 *
 * Spec V1.4: the channel is determined by the identifier kind, NOT manager choice.
 * Mobile → SMS, email → email. No cross-channel confirmation, so a stolen email
 * can't be confirmed by SMS to a different number.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | {
        customerRef?: string;
        identifierKind?: "mobile" | "email";
        /** Hashed by the lookup endpoint; we never see the raw identifier. */
        identifierHash?: string;
        items?: VerificationItem[];
      }
    | null;

  if (!body?.customerRef || !body.identifierKind || !body.identifierHash || !body.items?.length) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  // V1.4: channel is locked to the identifier kind.
  const channel = body.identifierKind === "mobile" ? "sms" : "email";

  const v = createVerification({
    customerRef: body.customerRef,
    identifierHash: body.identifierHash,
    venueId: session.venueId,
    venueName: session.venueName,
    managerName: session.managerName,
    sessionId: session.sessionId,
    channel,
    items: body.items,
  });

  const origin = new URL(req.url).origin;
  const link = `${origin}/verify/${v.token}`;
  const itemSummary = v.items
    .map((i) => (i.kind === "voucher" ? i.title : `Gift card ${i.maskedCode}`))
    .join(" + ");

  const text = `${v.venueName}: confirm to redeem ${itemSummary}. Tap to confirm — ${link} — or read code ${v.pin} to the staff member. Expires in 5 minutes.`;
  await airship.sendMessage(v.customerRef, v.channel, {
    subject: v.channel === "email" ? `Confirm your redemption at ${v.venueName}` : undefined,
    text,
  });

  await audit.append({
    action: "verification_sent",
    outcome: "ok",
    operatorId: session.operatorId,
    venueId: session.venueId,
    staffId: session.staffId,
    sessionId: session.sessionId,
    identifierHash: body.identifierHash,
    meta: {
      channel: v.channel,
      itemCount: v.items.length,
    },
  });

  return NextResponse.json({ token: v.token, expiresAt: v.expiresAt, channel: v.channel });
}
