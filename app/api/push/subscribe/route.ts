import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  upsertSubscription,
  removeByEndpoint,
  type PushPreferences,
  type SerialisedPushSubscription,
} from "@/lib/push";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as
    | { subscription?: SerialisedPushSubscription; preferences?: PushPreferences }
    | null;
  if (!body?.subscription || !body.preferences) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const stored = upsertSubscription({
    operatorId: session.operatorId,
    venueId: session.venueId,
    staffId: session.staffId,
    subscription: body.subscription,
    preferences: body.preferences,
  });
  return NextResponse.json({ id: stored.id });
}

export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) {
    return NextResponse.json({ error: "missing_endpoint" }, { status: 400 });
  }
  const removed = removeByEndpoint(body.endpoint);
  return NextResponse.json({ removed });
}
