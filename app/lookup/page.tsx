import { redirect } from "next/navigation";
import { ManagerShell } from "@/components/ManagerShell";
import { getSession } from "@/lib/session";
import { LookupForm } from "./LookupForm";

export default async function LookupPage() {
  const session = await getSession();
  if (!session) redirect("/");
  return (
    <ManagerShell
      manager={{ name: session.managerName, venue: session.venueName }}
      title="Customer lookup"
    >
      <p className="text-ink-muted mb-5">
        Enter the mobile number or email the customer hands you. You'll see what they can
        redeem — never their personal details.
      </p>
      <LookupForm />

      <div className="mt-8 text-xs text-ink-subtle">
        <p className="font-semibold mb-1">Try these demo identifiers</p>
        <ul className="space-y-1 text-ink-muted">
          <li>07700 900 001 — VIP, birthday this month</li>
          <li>07700 900 002 — Lapsed regular</li>
          <li>07700 900 003 — New customer</li>
          <li>07700 900 005 — VIP, gift card only</li>
        </ul>
      </div>
    </ManagerShell>
  );
}
