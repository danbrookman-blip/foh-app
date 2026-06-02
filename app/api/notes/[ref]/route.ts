import { NextResponse } from "next/server";
import { airship } from "@/lib/airship";
import { getSession } from "@/lib/session";
import { audit } from "@/lib/audit";

/**
 * Manager-attached notes on a customer profile.
 *
 * Notes can contain sensitive info (allergies, preferences). They're visible to all
 * managers at the venue. Production should add a retention policy + content guard
 * for slurs / PII-fishing — out of scope for prototype.
 *
 * Note-add events are written to the audit log alongside other manager actions.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const notes = await airship.getNotes(ref);
  return NextResponse.json({ notes });
}

export async function POST(req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  const { ref } = await params;
  const body = (await req.json().catch(() => null)) as { body?: string } | null;
  if (!body?.body) return NextResponse.json({ error: "missing_body" }, { status: 400 });

  const result = await airship.addNote({
    customerRef: ref,
    body: body.body,
    authorName: session.managerName,
    venueName: session.venueName,
  });
  if (!result.ok) {
    const status = result.reason === "empty" ? 400 : 413;
    return NextResponse.json({ error: result.reason }, { status });
  }
  await audit.append({
    action: "note_added",
    outcome: "ok",
    operatorId: session.operatorId,
    venueId: session.venueId,
    staffId: session.staffId,
    sessionId: session.sessionId,
    meta: { customerRef: ref, noteId: result.note.id, length: body.body.length },
  });
  return NextResponse.json({ note: result.note }, { status: 201 });
}
