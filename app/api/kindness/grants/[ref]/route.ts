import { NextResponse } from "next/server";
import { kindness } from "@/lib/kindness";

export async function GET(_req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const grants = await kindness.getRecentForCustomer(ref, 5);
  return NextResponse.json({ grants });
}
