import { NextResponse } from "next/server";
import { clearSession, setSession } from "@/lib/session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { managerName?: string; role?: "gm" | "system_manager" | "floor_manager"; venueName?: string }
    | null;
  if (!body?.managerName || !body.role || !body.venueName) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  await setSession({
    managerName: body.managerName,
    role: body.role,
    venueName: body.venueName,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
