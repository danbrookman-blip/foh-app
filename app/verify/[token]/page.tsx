import { notFound } from "next/navigation";
import { getVerification } from "@/lib/verification/store";
import { CustomerVerify } from "./CustomerVerify";

/**
 * Customer-facing verification page. Reached via SMS/email link.
 *
 * Trust-design choices:
 *  - Venue name is the most prominent element (sender identity, not a Claude/FOH brand)
 *  - Shows what they're confirming, in plain language
 *  - No fields to type — phishing-resistant: there's nothing to harvest
 *  - One tap, calm success state, with what to expect next
 */
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const v = getVerification(token);
  if (!v) return notFound();

  return (
    <div className="px-4 py-6 min-h-screen flex flex-col">
      <CustomerVerify
        token={token}
        status={v.status}
        venueName={v.venueName}
        managerName={v.managerName}
        items={v.items}
        expiresAt={v.expiresAt}
      />
    </div>
  );
}
