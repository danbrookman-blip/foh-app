import { NextResponse } from "next/server";
import { cancelVerification, getVerification } from "@/lib/verification/store";

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
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const v = cancelVerification(token);
  if (!v) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ status: v.status });
}
