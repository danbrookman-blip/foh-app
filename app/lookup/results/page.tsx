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
  searchParams: Promise<{ ref?: string; status?: string; id?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  const sp = await searchParams;

  if (sp.status === "nomatch") {
    return (
      <ManagerShell
        manager={{ name: session.managerName, venue: session.venueName }}
        title="No match"
        back="/lookup"
      >
        <div className="card p-5">
          <div className="text-lg font-semibold">No customer on file</div>
          <p className="text-ink-muted text-sm mt-1">
            We couldn't find <span className="font-medium text-ink">{sp.id}</span> in Airship or Toggle.
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

  if (!sp.ref) redirect("/lookup");

  const [vouchers, giftCards] = await Promise.all([
    airship.getVouchers(sp.ref),
    toggle.getGiftCards(sp.ref),
  ]);

  if (vouchers.length === 0 && giftCards.length === 0) {
    return (
      <ManagerShell
        manager={{ name: session.managerName, venue: session.venueName }}
        title="Nothing redeemable"
        back="/lookup"
      >
        <div className="card p-5">
          <div className="text-lg font-semibold">Customer on file — no live entitlements</div>
          <p className="text-ink-muted text-sm mt-1">
            They're a known customer, but there are no vouchers or gift cards available right now.
            You can still offer a discretionary gesture, or check back after a campaign launches.
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
      <ResultsClient customerRef={sp.ref} vouchers={vouchers} giftCards={giftCards} />
    </ManagerShell>
  );
}
