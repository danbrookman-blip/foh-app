import Link from "next/link";
import { getSession, DEMO_MANAGERS, DEMO_VENUES } from "@/lib/session";
import { ManagerShell } from "@/components/ManagerShell";
import { PushSetup } from "@/components/PushSetup";
import { LoginForm } from "./_components/LoginForm";
import { SignOutButton } from "./_components/SignOutButton";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    return (
      <ManagerShell>
        <div className="relative overflow-hidden rounded-xl2 mt-6 p-6 bg-airship-aura border border-navy-100/60">
          <div className="section-label">Front of house, on Airship</div>
          <h1 className="mt-1 text-[28px] font-bold leading-[1.1] tracking-tightish text-navy-900">
            Your personal customer assistant.
          </h1>
          <p className="text-ink-muted mt-2 text-[15px]">
            Look up entitlements, send a verification, redeem at the till. Notes and
            random acts of kindness, right where the customer is standing.
          </p>
        </div>
        <div className="mt-6">
          <LoginForm managers={DEMO_MANAGERS} venues={DEMO_VENUES} />
        </div>
      </ManagerShell>
    );
  }
  return (
    <ManagerShell manager={{ name: session.managerName, venue: session.venueName }} title="Settings">
      <div className="space-y-4">
        <Link href="/lookup" className="btn-primary w-full text-lg">
          Start a lookup
        </Link>
        <Link href="/arrivals" className="btn-ghost w-full">
          Open arrivals feed
        </Link>
        <Link href="/add-customer" className="btn-ghost w-full">
          Register new customer
        </Link>

        <div className="mt-6">
          <PushSetup />
        </div>

        <div className="card p-4 mt-6">
          <div className="text-xs uppercase tracking-wide text-ink-subtle mb-1">Signed in as</div>
          <div className="font-semibold">{session.managerName}</div>
          <div className="text-sm text-ink-muted">
            {prettyRole(session.role)} · {session.venueName}
          </div>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </div>
    </ManagerShell>
  );
}

function prettyRole(r: "gm" | "system_manager" | "floor_manager") {
  if (r === "gm") return "General Manager";
  if (r === "system_manager") return "System Manager";
  return "Floor Manager";
}
