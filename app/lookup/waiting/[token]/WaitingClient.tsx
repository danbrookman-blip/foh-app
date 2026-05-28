"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = "pending" | "confirmed" | "expired" | "cancelled";

type VerificationView = {
  status: Status;
  expiresAt: number;
  confirmedAt?: number;
  venueName: string;
  items: Array<
    | { kind: "voucher"; id: string; title: string; value: string }
    | { kind: "giftcard"; id: string; maskedCode: string; balancePence: number }
  >;
};

export function WaitingClient({ token }: { token: string }) {
  const [v, setV] = useState<VerificationView | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const res = await fetch(`/api/verifications/${token}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as VerificationView;
      if (cancelled) return;
      setV(data);
      setSecondsLeft(Math.max(0, Math.round((data.expiresAt - Date.now()) / 1000)));
    };
    poll();
    const interval = setInterval(poll, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  if (!v) return <div className="text-ink-muted">Loading…</div>;

  if (v.status === "confirmed") {
    return (
      <div className="space-y-4">
        <div className="card p-6 text-center bg-ok-soft border-ok/20">
          <div className="text-4xl mb-2">✓</div>
          <div className="text-xl font-bold text-ok">Customer confirmed</div>
          <p className="text-sm text-ink-muted mt-2">
            Redemption authorised. Apply at the till as normal.
          </p>
        </div>
        <div className="card p-4">
          <div className="text-sm font-semibold mb-2">Authorised</div>
          <ul className="space-y-2 text-sm">
            {v.items.map((i, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{i.kind === "voucher" ? i.title : `Gift card ${i.maskedCode}`}</span>
                <span className="font-semibold">
                  {i.kind === "voucher" ? i.value : `£${(i.balancePence / 100).toFixed(2)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/lookup" className="btn-primary w-full">
          Next lookup
        </Link>
      </div>
    );
  }

  if (v.status === "expired" || v.status === "cancelled") {
    return (
      <div className="space-y-4">
        <div className="card p-5 bg-warn-soft border-warn/20">
          <div className="text-lg font-semibold text-warn">
            {v.status === "expired" ? "Link expired" : "Cancelled"}
          </div>
          <p className="text-sm text-ink-muted mt-1">
            Start a fresh lookup if the customer's still at the bar.
          </p>
        </div>
        <Link href="/lookup" className="btn-primary w-full">
          Back to lookup
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-6 text-center">
        <div className="relative inline-flex h-16 w-16 items-center justify-center mb-3">
          <span className="absolute inset-0 rounded-full bg-ink/5 animate-ping" />
          <span className="relative h-3 w-3 rounded-full bg-ink" />
        </div>
        <div className="text-lg font-semibold">Sent — waiting on their tap</div>
        <p className="text-sm text-ink-muted mt-1">
          Link expires in <span className="font-semibold text-ink">{formatSeconds(secondsLeft)}</span>
        </p>
      </div>

      <div className="card p-4">
        <div className="text-sm font-semibold mb-2">Awaiting confirmation for</div>
        <ul className="space-y-2 text-sm">
          {v.items.map((i, idx) => (
            <li key={idx} className="flex justify-between">
              <span>{i.kind === "voucher" ? i.title : `Gift card ${i.maskedCode}`}</span>
              <span className="font-semibold">
                {i.kind === "voucher" ? i.value : `£${(i.balancePence / 100).toFixed(2)}`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <details className="card p-4">
        <summary className="text-sm font-semibold cursor-pointer">Customer not getting the message?</summary>
        <p className="text-sm text-ink-muted mt-2">
          Ask them to check their texts/junk folder. If the link expires, start a fresh lookup.
          Don't redeem anything without their tap — that's the policy.
        </p>
      </details>

      <button
        className="btn-ghost w-full"
        onClick={async () => {
          await fetch(`/api/verifications/${token}`, { method: "DELETE" });
          location.href = "/lookup";
        }}
      >
        Cancel and start again
      </button>

      <p className="text-xs text-ink-subtle text-center">
        Demo tip: open <span className="font-mono">/verify/{token}</span> in another tab to simulate the customer's confirmation.
      </p>
    </div>
  );
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
