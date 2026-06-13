"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = "pending" | "confirmed" | "expired" | "cancelled";

type VerificationView = {
  status: Status;
  expiresAt: number;
  confirmedAt?: number;
  venueName: string;
  channel: "sms" | "email";
  pinAttemptsRemaining: number;
  items: Array<
    | { kind: "voucher"; id: string; title: string; value: string }
    | { kind: "giftcard"; id: string; maskedCode: string; balancePence: number }
  >;
};

export function WaitingClient({ token }: { token: string }) {
  const [v, setV] = useState<VerificationView | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSubmitting, setPinSubmitting] = useState(false);

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
          <span className="absolute inset-0 rounded-full bg-accent-soft animate-ping" />
          <span className="relative h-3 w-3 rounded-full bg-warm-purple" />
        </div>
        <div className="text-lg font-semibold">Sent — waiting on their tap</div>
        <p className="text-sm text-ink-muted mt-1">
          Sent by {v.channel === "sms" ? "text" : "email"}. Link expires in{" "}
          <span className="font-semibold text-ink">{formatSeconds(secondsLeft)}</span>
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

      {/* V1.2 — PIN fallback */}
      <div className="card p-4">
        <button
          type="button"
          className="w-full flex items-center justify-between text-left"
          onClick={() => setPinOpen((o) => !o)}
          aria-expanded={pinOpen}
        >
          <span className="text-sm font-semibold">Customer can't get the message?</span>
          <span className="text-ink-subtle text-sm">{pinOpen ? "−" : "+"}</span>
        </button>
        {pinOpen ? (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-ink-muted">
              Ask the customer to read out the 6-digit code from their message. Audit
              flag will mark this redemption as fallback-confirmed for review.
            </p>
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="off"
              className="field text-center text-2xl tracking-[0.4em] font-mono"
              placeholder="000000"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setPinError(null);
              }}
            />
            {pinError ? <div className="text-sm text-accent">{pinError}</div> : null}
            <button
              type="button"
              className="btn-accent w-full"
              disabled={pin.length !== 6 || pinSubmitting}
              onClick={async () => {
                setPinSubmitting(true);
                setPinError(null);
                const res = await fetch(`/api/verifications/${token}/confirm-pin`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ pin }),
                });
                const data = await res.json().catch(() => ({}));
                setPinSubmitting(false);
                if (!res.ok) {
                  setPinError(
                    data?.error === "pin_wrong"
                      ? `Wrong code. Attempts remaining: ${Math.max(0, v.pinAttemptsRemaining - 1)}.`
                      : data?.error === "rate_limited"
                      ? "Too many attempts. Start a fresh lookup."
                      : data?.error === "expired"
                      ? "Link has expired."
                      : "Couldn't confirm. Try again.",
                  );
                  return;
                }
                // Confirmed via PIN — let the poll catch up
              }}
            >
              {pinSubmitting ? "Confirming…" : "Confirm with code"}
            </button>
            <p className="text-[11px] text-ink-subtle">
              Up to {v.pinAttemptsRemaining} attempts before the code locks out.
            </p>
          </div>
        ) : null}
      </div>

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
        Demo tip: open <span className="font-mono">/verify/{token}</span> in another tab to simulate the customer's tap.
      </p>
    </div>
  );
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
