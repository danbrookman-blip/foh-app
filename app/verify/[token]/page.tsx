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
      <footer className="mt-8 pt-4 border-t border-navy-100/60 flex items-center justify-center gap-1.5 text-[11px] text-ink-subtle">
        <svg width="14" height="14" viewBox="0 0 48 48" fill="none" aria-hidden>
          <rect width="48" height="48" rx="12" fill="#3D0A4D" />
          <ellipse cx="24" cy="22" rx="15" ry="6.5" fill="none" stroke="#D824D8" strokeWidth="2.5" />
          <rect x="20.5" y="29" width="7" height="2" rx="1" fill="#D824D8" />
        </svg>
        <span>Secured by Airship Lookout</span>
      </footer>
    </div>
  );
}
