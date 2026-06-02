import Link from "next/link";
import { redirect } from "next/navigation";
import { ManagerShell } from "@/components/ManagerShell";
import { getSession } from "@/lib/session";
import { airship } from "@/lib/airship";
import { toggle } from "@/lib/toggle";
import { ResultsClient } from "./ResultsClient";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; status?: string; id?: string; kind?: string; hash?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  const sp = await searchParams;

  if (sp.status === "nomatch") {
    return (
      <ManagerShell
        manager={{ name: session.managerName, venue: session.venueName }}
        title="No entitlements found"
        back="/lookup"
      >
        <div className="card p-5">
          <div className="text-lg font-semibold">No entitlements found</div>
          <p className="text-ink-muted text-sm mt-1">
            Nothing on file for that contact at this venue right now. They may still be
            a customer — register them to capture for next time.
          </p>
          <div className="mt-5 grid gap-3">
            <Link href="/add-customer" className="btn-accent w-full">
              Register them now
            </Link>
            <Link href="/lookup" className="btn-ghost w-full">
              Try a different identifier
            </Link>
          </div>
        </div>
      </ManagerShell>
    );
  }

  if (!sp.ref || !sp.kind || !sp.hash) redirect("/lookup");

  const identifierKind = sp.kind === "email" ? "email" : "mobile";
  const identifierHash = sp.hash;

  const [vouchers, giftCards] = await Promise.all([
    airship.getVouchers(sp.ref),
    toggle.getGiftCards(sp.ref),
  ]);

  if (vouchers.length === 0 && giftCards.length === 0) {
    return (
      <ManagerShell
        manager={{ name: session.managerName, venue: session.venueName }}
        title="No entitlements found"
        back="/lookup"
      >
        <div className="card p-5">
          <div className="text-lg font-semibold">No entitlements found</div>
          <p className="text-ink-muted text-sm mt-1">
            No vouchers or gift cards available right now. A discretionary gesture
            (random act of kindness) might be the right call.
          </p>
        </div>
      </ManagerShell>
    );
  }

  return (
    <ManagerShell
      manager={{ name: session.managerName, venue: session.venueName }}
      title="What they can redeem"
      back="/lookup"
    >
      <ResultsClient
        customerRef={sp.ref}
        identifierKind={identifierKind}
        identifierHash={identifierHash}
        vouchers={vouchers}
        giftCards={giftCards}
      />
    </ManagerShell>
  );
}
