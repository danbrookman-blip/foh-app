import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { findByEndpoint, sendPush } from "@/lib/push";

/**
 * Debug endpoint: fire a test notification to the device that owns `endpoint`.
 * Useful when verifying setup. Not gated by criteria — for diagnostics only.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) {
    return NextResponse.json({ error: "missing_endpoint" }, { status: 400 });
  }
  const sub = findByEndpoint(body.endpoint);
  if (!sub) return NextResponse.json({ error: "not_subscribed" }, { status: 404 });

  const res = await sendPush(sub, {
    title: "Airship Lookout test",
    body: "Pings are working. You'll see arrivals like this.",
    url: "/arrivals",
    tag: "lookout-test",
  });
  if (!res.ok) return NextResponse.json({ error: res.reason }, { status: 502 });
  return NextResponse.json({ ok: true });
}
