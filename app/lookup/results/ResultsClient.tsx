"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Voucher } from "@/lib/airship/types";
import type { GiftCard } from "@/lib/toggle/types";
import { VoucherCard, GiftCardItem } from "@/components/EntitlementCard";

type Props = {
  customerRef: string;
  identifierKind: "mobile" | "email";
  identifierHash: string;
  vouchers: Voucher[];
  giftCards: GiftCard[];
};

type SelectedKey = `v:${string}` | `g:${string}`;

export function ResultsClient({
  customerRef,
  identifierKind,
  identifierHash,
  vouchers,
  giftCards,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<SelectedKey>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = useMemo(() => {
    const out: Array<
      | { kind: "voucher"; id: string; title: string; value: string }
      | { kind: "giftcard"; id: string; maskedCode: string; balancePence: number }
    > = [];
    for (const v of vouchers) {
      if (selected.has(`v:${v.id}`)) {
        out.push({ kind: "voucher", id: v.id, title: v.title, value: v.value });
      }
    }
    for (const g of giftCards) {
      if (selected.has(`g:${g.id}`)) {
        out.push({
          kind: "giftcard",
          id: g.id,
          maskedCode: g.maskedCode,
          balancePence: g.balancePence,
        });
      }
    }
    return out;
  }, [selected, vouchers, giftCards]);

  // V1.4: channel is locked by identifier kind. No manager choice surfaced.
  const channelLabel = identifierKind === "mobile" ? "text" : "email";

  return (
    <div className="space-y-5">
      <div className="card p-4 bg-surface-tint border-pink-100">
        <div className="section-label">What the manager sees</div>
        <div className="text-sm text-ink-muted mt-1">
          No name, no number, no email. Just what they can redeem on this visit.
        </div>
      </div>

      {vouchers.length > 0 ? (
        <section>
          <h2 className="section-label mb-2">Vouchers · Airship</h2>
          <div className="space-y-3">
            {vouchers.map((v) => (
              <VoucherCard
                key={v.id}
                title={v.title}
                description={v.description}
                value={v.value}
                expiresAt={v.expiresAt}
                kindLabel={voucherLabel(v.type)}
                selected={selected.has(`v:${v.id}`)}
                onToggle={() => toggle(selected, setSelected, `v:${v.id}`)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {giftCards.length > 0 ? (
        <section>
          <h2 className="section-label mb-2">Gift cards · Toggle</h2>
          <div className="space-y-3">
            {giftCards.map((g) => (
              <GiftCardItem
                key={g.id}
                maskedCode={g.maskedCode}
                balancePence={g.balancePence}
                expiresAt={g.expiresAt}
                selected={selected.has(`g:${g.id}`)}
                onToggle={() => toggle(selected, setSelected, `g:${g.id}`)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="card p-4">
        <div className="text-sm font-semibold">Verification channel</div>
        <p className="text-sm text-ink-muted mt-1">
          We'll {channelLabel} the {identifierKind} they provided. You don't see the
          address — they tap their own link to authorise the redemption.
        </p>
      </section>

      {error ? <div className="text-sm text-accent">{error}</div> : null}

      <button
        className="btn-primary w-full text-lg sticky bottom-24"
        disabled={items.length === 0 || submitting}
        onClick={async () => {
          setSubmitting(true);
          setError(null);
          const res = await fetch("/api/verifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerRef,
              identifierKind,
              identifierHash,
              items,
            }),
          });
          const data = await res.json();
          setSubmitting(false);
          if (!res.ok) {
            setError("Couldn't send. Try again.");
            return;
          }
          router.push(`/lookup/waiting/${data.token}`);
        }}
      >
        {items.length === 0
          ? "Select at least one to continue"
          : submitting
          ? "Sending…"
          : `Send verification · ${items.length} item${items.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}

function toggle(
  set: Set<SelectedKey>,
  apply: (s: Set<SelectedKey>) => void,
  key: SelectedKey,
) {
  const next = new Set(set);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  apply(next);
}

function voucherLabel(t: string) {
  switch (t) {
    case "birthday":
      return "Birthday";
    case "loyalty":
      return "Loyalty";
    case "recovery":
      return "Recovery";
    case "welcome":
      return "Welcome";
    default:
      return "Voucher";
  }
}
