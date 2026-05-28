import { redirect } from "next/navigation";
import { ManagerShell } from "@/components/ManagerShell";
import { getSession } from "@/lib/session";
import { ArrivalsClient } from "./ArrivalsClient";

export default async function ArrivalsPage() {
  const session = await getSession();
  if (!session) redirect("/");
  return (
    <ManagerShell
      manager={{ name: session.managerName, venue: session.venueName }}
      title="Arrivals tonight"
    >
      <p className="text-ink-muted mb-4 text-sm">
        Known customers who've just walked in. Signals, not records — designed to help you
        greet, not pry.
      </p>
      <ArrivalsClient />
    </ManagerShell>
  );
}
