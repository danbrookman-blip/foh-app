import { redirect } from "next/navigation";
import { ManagerShell } from "@/components/ManagerShell";
import { getSession } from "@/lib/session";
import { WaitingClient } from "./WaitingClient";

export default async function WaitingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  const { token } = await params;
  return (
    <ManagerShell
      manager={{ name: session.managerName, venue: session.venueName }}
      title="Waiting on customer"
      back="/lookup"
    >
      <WaitingClient token={token} />
    </ManagerShell>
  );
}
