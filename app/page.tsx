import Link from "next/link";
import { getSession, DEMO_MANAGERS, DEMO_VENUES } from "@/lib/session";
import { ManagerShell } from "@/components/ManagerShell";
import { LoginForm } from "./_components/LoginForm";
import { SignOutButton } from "./_components/SignOutButton";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    return (
      <ManagerShell>
        <div className="mt-6">
          <h1 className="text-2xl font-bold leading-tight">Front of House</h1>
          <p className="text-ink-muted mt-2 text-base">
            Look up customer entitlements, send a verification, redeem at the till.
            No customer data on screen.
          </p>
          <div className="mt-8">
            <LoginForm managers={DEMO_MANAGERS} venues={DEMO_VENUES} />
          </div>
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
