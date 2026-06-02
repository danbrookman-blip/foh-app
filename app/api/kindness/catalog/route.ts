import { NextResponse } from "next/server";
import { kindness } from "@/lib/kindness";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  const catalog = await kindness.getCatalog(session.venueName);
  return NextResponse.json({ catalog, venueName: session.venueName });
}
