import { redirect } from "next/navigation";
import { ManagerShell } from "@/components/ManagerShell";
import { getSession } from "@/lib/session";
import { AddCustomerForm } from "./AddCustomerForm";

export default async function AddCustomerPage() {
  const session = await getSession();
  if (!session) redirect("/");
  return (
    <ManagerShell
      manager={{ name: session.managerName, venue: session.venueName }}
      title="Register customer"
      back="/lookup"
    >
      <p className="text-ink-muted mb-5">
        Capture the basics now — Airship will handle welcome and the rest.
      </p>
      <AddCustomerForm />
    </ManagerShell>
  );
}
