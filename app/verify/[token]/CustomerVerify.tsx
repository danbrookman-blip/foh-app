"use client";

import { useEffect, useState } from "react";

type Item =
  | { kind: "voucher"; id: string; title: string; value: string }
  | { kind: "giftcard"; id: string; maskedCode: string; balancePence: number };

type Status = "pending" | "confirmed" | "expired" | "cancelled";

type Props = {
  token: string;
  status: Status;
  venueName: string;
  managerName: string;
  items: Item[];
  expiresAt: number;
};

export function CustomerVerify(props: Props) {
  const [status, setStatus] = useState<Status>(props.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(
    Math.max(0, Math.round((props.expiresAt - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (status !== "pending") return;
    const interval = setInterval(() => {
      const s = Math.max(0, Math.round((props.expiresAt - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s === 0) setStatus("expired");
    }, 1000);
    return () => clearInterval(interval);
  }, [status, props.expiresAt]);

  if (status === "confirmed") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="text-xs uppercase tracking-wide text-ink-subtle">{props.venueName}</div>
        <h1 className="text-2xl font-bold mt-1">You're confirmed</h1>

        <div className="card p-6 mt-6 text-center bg-ok-soft border-ok/20">
          <div className="text-5xl mb-2">✓</div>
          <p className="font-semibold text-ok">Pass this back to {firstWord(props.managerName)}</p>
          <p className="text-sm text-ink-muted mt-1">
            Your redemption is unlocked at the till. No need to do anything else.
          </p>
        </div>

        <ItemList items={props.items} />

        <div className="card p-4 mt-4 border-dashed border-2 border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">How was it?</span>
                <span className="pill-mute">Coming soon</span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                A quick rating will live here once HGEM feedback is wired up.
              </p>
            </div>
            <div className="flex gap-1 text-2xl opacity-40 select-none" aria-hidden>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-ink-subtle text-center mt-6">
          This page can be closed. Enjoy your visit.
        </p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="text-xs uppercase tracking-wide text-ink-subtle">{props.venueName}</div>
        <h1 className="text-2xl font-bold mt-1">Link expired</h1>
        <div className="card p-5 mt-6 bg-warn-soft border-warn/20">
          <p className="text-sm text-ink">
            For your safety, this link only works for 10 minutes. Ask{" "}
            {firstWord(props.managerName)} to send a fresh one.
          </p>
        </div>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="flex-1 flex flex-col">
        <div className="text-xs uppercase tracking-wide text-ink-subtle">{props.venueName}</div>
        <h1 className="text-2xl font-bold mt-1">Cancelled</h1>
        <p className="text-ink-muted text-sm mt-2">
          {firstWord(props.managerName)} cancelled this request. Speak to them at the bar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-xs uppercase tracking-wide text-ink-subtle">{props.venueName}</div>
      <h1 className="text-2xl font-bold mt-1 leading-tight">
        Confirm you're here to redeem
      </h1>
      <p className="text-ink-muted mt-2">
        {firstWord(props.managerName)} sent this to verify you're at the venue. Tap below
        to authorise — that's all you need to do.
      </p>

      <ItemList items={props.items} />

      <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
        <span className="pill-mute">Expires in {formatSeconds(secondsLeft)}</span>
        <span className="pill-mute">No login</span>
        <span className="pill-mute">No card details</span>
      </div>

      {error ? <div className="text-sm text-accent mt-3">{error}</div> : null}

      <div className="mt-auto pt-6 space-y-3">
        <button
          className="btn-accent w-full text-lg"
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            setError(null);
            const res = await fetch(`/api/verifications/${props.token}/confirm`, {
              method: "POST",
            });
            const data = await res.json().catch(() => ({}));
            setSubmitting(false);
            if (!res.ok) {
              setError(
                data?.error === "expired"
                  ? "This link has expired — ask for a fresh one."
                  : "Something went wrong. Try again.",
              );
              return;
            }
            setStatus("confirmed");
          }}
        >
          {submitting ? "Confirming…" : "Yes, redeem it now"}
        </button>
        <p className="text-xs text-ink-subtle text-center">
          By tapping Yes you authorise {firstWord(props.managerName)} to apply these to your bill.
        </p>
      </div>
    </div>
  );
}

function ItemList({ items }: { items: Item[] }) {
  return (
    <div className="card p-4 mt-6">
      <div className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-3">
        Redeeming
      </div>
      <ul className="space-y-3">
        {items.map((i, idx) => (
          <li key={idx} className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">
                {i.kind === "voucher" ? i.title : `Gift card ${i.maskedCode}`}
              </div>
              {i.kind === "voucher" ? null : (
                <div className="text-xs text-ink-muted">Toggle balance</div>
              )}
            </div>
            <div className="text-accent font-bold">
              {i.kind === "voucher" ? i.value : `£${(i.balancePence / 100).toFixed(2)}`}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function firstWord(name: string) {
  return name.split(" ")[0] ?? name;
}
