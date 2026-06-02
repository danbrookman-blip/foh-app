import { NextResponse } from "next/server";
import { cancelVerification, getVerification } from "@/lib/verification/store";
import { audit } from "@/lib/audit";
import { getSession } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const v = getVerification(token);
  if (!v) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    status: v.status,
    expiresAt: v.expiresAt,
    confirmedAt: v.confirmedAt,
    venueName: v.venueName,
    items: v.items,
    channel: v.channel,
    pinAttemptsRemaining: Math.max(0, 5 - v.pinAttempts),
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await getSession();
  const { token } = await params;
  const v = cancelVerification(token);
  if (!v) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (session) {
    await audit.append({
      action: "verification_cancelled",
      outcome: "ok",
      operatorId: session.operatorId,
      venueId: session.venueId,
      staffId: session.staffId,
      sessionId: session.sessionId,
      identifierHash: v.identifierHash,
    });
  }
  return NextResponse.json({ status: v.status });
}
