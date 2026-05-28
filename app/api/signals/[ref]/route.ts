import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";

export async function GET(_req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const signals = await airship.getSignals(ref);
  if (!signals) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(signals);
}
