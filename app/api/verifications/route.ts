import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { createVerification, type VerificationItem } from "@/lib/verification/store";
import { getSession } from "@/lib/session";

/**
 * Manager triggers a verification send. The customer receives a one-tap link.
 * Confirmation by the customer is the authorisation event for redemption.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | { customerRef?: string; channel?: "sms" | "email"; items?: VerificationItem[] }
    | null;

  if (!body?.customerRef || !body.channel || !body.items?.length) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const v = createVerification({
    customerRef: body.customerRef,
    venueName: session.venueName,
    managerName: session.managerName,
    channel: body.channel,
    items: body.items,
  });

  const origin = new URL(req.url).origin;
  const link = `${origin}/verify/${v.token}`;
  const itemSummary = v.items
    .map((i) => (i.kind === "voucher" ? i.title : `Gift card ${i.maskedCode}`))
    .join(" + ");

  const text = `${v.venueName}: confirm to redeem ${itemSummary} on this visit. Tap to confirm — ${link}. Link expires in 10 minutes.`;
  await airship.sendMessage(v.customerRef, v.channel, {
    subject: v.channel === "email" ? `Confirm your redemption at ${v.venueName}` : undefined,
    text,
  });

  return NextResponse.json({ token: v.token, expiresAt: v.expiresAt });
}
