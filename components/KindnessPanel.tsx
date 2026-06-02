"use client";

import { useEffect, useState } from "react";

type CatalogEntry = {
  code: string;
  name: string;
  description: string;
  icon: string;
  monthlyLimit: number;
  usedThisMonth: number;
  remaining: number;
};

type Grant = {
  id: string;
  awardCode: string;
  recipientLabel: string;
  managerName: string;
  grantedAt: number;
};

export function KindnessPanel({
  customerRef,
  displayName,
}: {
  customerRef: string;
  displayName: string;
}) {
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(null);
  const [recent, setRecent] = useState<Grant[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<CatalogEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justGranted, setJustGranted] = useState<{ awardName: string; icon: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [catRes, recentRes] = await Promise.all([
        fetch("/api/kindness/catalog", { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/kindness/grants/${customerRef}`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (cancelled) return;
      setCatalog(catRes.catalog ?? []);
      setRecent(recentRes.grants ?? []);
    };
    if (open && !catalog) load();
    return () => {
      cancelled = true;
    };
  }, [open, catalog, customerRef]);

  // Always load recent (so the count shows on the collapsed header), but only when ref is known.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/kindness/grants/${customerRef}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setRecent(d.grants ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [customerRef]);

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <button
        type="button"
        className="w-full flex items-center justify-between text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-ink">
          Random act of kindness
          {recent.length > 0 ? (
            <span className="ml-2 pill-warn">had one recently</span>
          ) : null}
        </span>
        <span className="text-ink-subtle text-sm">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          {recent.length > 0 ? (
            <div className="rounded-xl2 bg-warn-soft p-3 text-xs text-ink">
              <span className="font-semibold">Heads up:</span>{" "}
              {displayName.split(" ")[0]} had {awardNameForCode(catalog, recent[0].awardCode)}{" "}
              {relative(recent[0].grantedAt)} (from {recent[0].managerName}). Pile on with care.
            </div>
          ) : null}

          {justGranted ? (
            <div className="rounded-xl2 bg-ok-soft p-3 text-sm">
              <span className="font-semibold text-ok">{justGranted.icon} {justGranted.awardName}</span>{" "}
              given to {displayName}. Apply at the till.
            </div>
          ) : null}

          {pending ? (
            <div className="card p-4 border-2 border-ink">
              <div className="text-sm">
                Give <span className="font-semibold">{pending.icon} {pending.name}</span> to{" "}
                <span className="font-semibold">{displayName}</span>?
              </div>
              <div className="text-xs text-ink-muted mt-1">
                This will be {pending.usedThisMonth + 1} of {pending.monthlyLimit} this month at this venue.
              </div>
              {error ? <div className="text-sm text-accent mt-2">{error}</div> : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={submitting}
                  onClick={() => {
                    setPending(null);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-accent"
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    setError(null);
                    const res = await fetch("/api/kindness/grants", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        awardCode: pending.code,
                        customerRef,
                        recipientLabel: displayName,
                      }),
                    });
                    setSubmitting(false);
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      setError(
                        data?.error === "quota_exhausted"
                          ? "This month's quota is gone — try a different one."
                          : "Couldn't record it. Try again.",
                      );
                      return;
                    }
                    setJustGranted({ awardName: pending.name, icon: pending.icon });
                    // Refresh catalog + recent
                    const [catRes, recentRes] = await Promise.all([
                      fetch("/api/kindness/catalog", { cache: "no-store" }).then((r) => r.json()),
                      fetch(`/api/kindness/grants/${customerRef}`, { cache: "no-store" }).then((r) =>
                        r.json(),
                      ),
                    ]);
                    setCatalog(catRes.catalog ?? []);
                    setRecent(recentRes.grants ?? []);
                    setPending(null);
                  }}
                >
                  {submitting ? "Recording…" : "Confirm"}
                </button>
              </div>
            </div>
          ) : !catalog ? (
            <div className="text-sm text-ink-muted">Loading awards…</div>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {catalog.map((a) => {
                const out = a.remaining === 0;
                return (
                  <li key={a.code}>
                    <button
                      type="button"
                      disabled={out}
                      onClick={() => {
                        setPending(a);
                        setError(null);
                      }}
                      className={`w-full text-left rounded-xl2 p-3 border transition ${
                        out
                          ? "bg-slate-50 border-slate-200 text-ink-subtle cursor-not-allowed"
                          : "bg-white border-slate-200 hover:border-ink active:scale-[0.99]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none" aria-hidden>
                          {a.icon}
                        </span>
                        <span className="text-sm font-semibold">{a.name}</span>
                      </div>
                      <div className="mt-1 text-xs">
                        {out ? (
                          <span className="text-warn font-medium">None left this month</span>
                        ) : (
                          <span className="text-ink-muted">
                            {a.remaining} of {a.monthlyLimit} left
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function awardNameForCode(catalog: CatalogEntry[] | null, code: string): string {
  return catalog?.find((c) => c.code === code)?.name?.toLowerCase() ?? code.replace(/_/g, " ");
}

function relative(ts: number) {
  const diff = Date.now() - ts;
  const day = 86_400_000;
  if (diff < day) return "today";
  if (diff < 2 * day) return "yesterday";
  const days = Math.round(diff / day);
  if (days < 14) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `${weeks} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}
