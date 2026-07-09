"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrivalCard } from "@/components/ArrivalCard";
import type { CriterionCode, CriterionEvaluation } from "@/lib/arrival-criteria";

type Arrival = {
  customerRef: string;
  displayName: string;
  tier: "new" | "regular" | "vip" | "at-risk" | "recovery";
  lastVisitAt: number;
  visitsLast90Days: number;
  lifetimeVisits: number;
  favouriteCategory: string;
  lastItemOrdered: string;
  birthdayThisMonth: boolean;
  anniversaryThisMonth?: boolean;
  arrivedAt: number;
  at: number;
  kind: "arrived" | "booking";
  source: string;
  bookingSize: number | null;
  triggered: CriterionEvaluation[];
};

/** The signal categories the manager can filter the board by. */
const CATEGORIES: { code: CriterionCode; label: string }[] = [
  { code: "birthday_month", label: "Birthday" },
  { code: "anniversary", label: "Anniversary" },
  { code: "at_risk", label: "At risk" },
  { code: "vip", label: "VIP" },
  { code: "lapsed_returning", label: "Lapsed regular" },
  { code: "voucher_expiring", label: "Voucher expiring" },
  { code: "large_booking", label: "Large party" },
];

function clock(at: number) {
  return new Date(at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ArrivalsClient() {
  const [arrivals, setArrivals] = useState<Arrival[] | null>(null);
  const [active, setActive] = useState<Set<CriterionCode>>(new Set());
  const [demoBusy, setDemoBusy] = useState<string | null>(null);
  const [demoResult, setDemoResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchOnce = async () => {
      const res = await fetch("/api/arrivals", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { arrivals: Arrival[] };
      if (!cancelled) setArrivals(data.arrivals);
    };
    fetchOnce();
    const interval = setInterval(fetchOnce, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const toggle = (code: CriterionCode) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  // Per-category counts across the whole board (unfiltered) for the checkboxes.
  const counts = useMemo(() => {
    const c = new Map<CriterionCode, number>();
    for (const a of arrivals ?? []) {
      const seen = new Set<CriterionCode>();
      for (const t of a.triggered) {
        if (!seen.has(t.code)) {
          seen.add(t.code);
          c.set(t.code, (c.get(t.code) ?? 0) + 1);
        }
      }
    }
    return c;
  }, [arrivals]);

  const triggerArrival = async (a: Arrival) => {
    setDemoBusy(a.customerRef);
    setDemoResult(null);
    const res = await fetch("/api/arrivals/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerRef: a.customerRef, bookingSize: a.bookingSize }),
    });
    const data = await res.json().catch(() => ({}));
    setDemoBusy(null);
    if (!res.ok) {
      setDemoResult(`Failed: ${data?.error ?? res.statusText}`);
      return;
    }
    const criteriaList = (data.triggered ?? [])
      .map((t: { label: string }) => t.label)
      .join(", ");
    setDemoResult(
      data.triggered?.length
        ? `Triggered: ${criteriaList}. Pushed to ${data.pushed} of ${data.recipientCount} device(s).`
        : "No criteria matched — nothing pushed.",
    );
  };

  if (arrivals === null) {
    return <div className="text-ink-muted text-sm">Loading…</div>;
  }
  if (arrivals.length === 0) {
    return (
      <div className="card p-5 text-sm text-ink-muted">
        No known customers in yet. They'll appear here as they connect to Wi-Fi or check in.
      </div>
    );
  }

  const matches = (a: Arrival) =>
    active.size === 0 || a.triggered.some((t) => active.has(t.code));

  const hereAll = arrivals.filter((a) => a.kind === "arrived");
  const laterAll = arrivals.filter((a) => a.kind === "booking");
  const here = hereAll.filter(matches);
  const later = laterAll.filter(matches);
  const priorityCount = arrivals.filter((a) =>
    a.triggered.some((t) => t.priority >= 80),
  ).length;
  const filtered = active.size > 0;

  // Group the (filtered) bookings by their 30-minute time slot, soonest first.
  const slots = new Map<number, Arrival[]>();
  for (const a of later) {
    const list = slots.get(a.at) ?? [];
    list.push(a);
    slots.set(a.at, list);
  }
  const slotGroups = [...slots.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-5">
      <section className="hidden md:grid grid-cols-3 gap-4">
        <Stat number={hereAll.length} label="Here now" />
        <Stat number={laterAll.length} label="Coming later today" />
        <Stat
          number={priorityCount}
          label={priorityCount === 1 ? "Priority signal" : "Priority signals"}
          accent
        />
      </section>

      {/* Filter by signal category */}
      <section className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-label">Filter by signal</h2>
          {filtered ? (
            <button
              type="button"
              onClick={() => setActive(new Set())}
              className="text-xs font-semibold text-warm-purple hover:underline"
            >
              Clear ({active.size})
            </button>
          ) : (
            <span className="text-xs text-ink-subtle">Showing all</span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const n = counts.get(cat.code) ?? 0;
            const on = active.has(cat.code);
            return (
              <label
                key={cat.code}
                className={`inline-flex items-center gap-2 rounded-xl2 border px-3 py-1.5 text-sm cursor-pointer transition select-none ${
                  on
                    ? "bg-deep-purple text-white border-deep-purple"
                    : "bg-surface border-platinum/70 text-ink hover:bg-surface-tint/50"
                } ${n === 0 ? "opacity-45" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(cat.code)}
                  className="accent-neon-magenta h-3.5 w-3.5"
                />
                <span className="font-semibold">{cat.label}</span>
                <span
                  className={`tabular-nums text-xs rounded-full px-1.5 py-0.5 ${
                    on ? "bg-white/20 text-white" : "bg-surface-tint text-ink-subtle"
                  }`}
                >
                  {n}
                </span>
              </label>
            );
          })}
        </div>
        {filtered ? (
          <p className="mt-3 text-xs text-ink-subtle">
            Showing {here.length + later.length} of {arrivals.length} guests matching{" "}
            {[...active]
              .map((c) => CATEGORIES.find((x) => x.code === c)?.label)
              .filter(Boolean)
              .join(", ")}
            .
          </p>
        ) : null}
      </section>

      <details className="card p-4">
        <summary className="text-sm font-semibold cursor-pointer">
          Demo controls — simulate an arrival
        </summary>
        <p className="text-xs text-ink-muted mt-2">
          In production, arrivals fire from Wi-Fi sign-in or a reservation webhook.
          Here you can trigger one manually to see the criteria evaluate and the push fire.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {hereAll.map((a) => (
            <button
              key={a.customerRef}
              type="button"
              disabled={demoBusy === a.customerRef}
              onClick={() => triggerArrival(a)}
              className="btn-ghost text-left justify-between text-sm"
            >
              <span>
                {a.displayName}
                {a.triggered.length > 0 ? (
                  <span className="ml-2 text-ink-subtle">
                    ({a.triggered.map((t) => t.label).join(", ")})
                  </span>
                ) : (
                  <span className="ml-2 text-ink-subtle">(no triggers)</span>
                )}
              </span>
              <span className="text-xs text-ink-subtle">
                {demoBusy === a.customerRef ? "Firing…" : "Trigger →"}
              </span>
            </button>
          ))}
        </div>
        {demoResult ? (
          <div className="mt-3 text-sm text-ink">{demoResult}</div>
        ) : null}
      </details>

      {here.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="section-label">Here now</h2>
            <span className="text-xs text-ink-subtle">{here.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 items-start">
            {here.map((a) => (
              <ArrivalCard key={a.customerRef} {...a} />
            ))}
          </div>
        </section>
      ) : null}

      {slotGroups.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="section-label">Coming later today</h2>
            <span className="text-xs text-ink-subtle">{later.length} bookings</span>
          </div>
          <div className="space-y-4">
            {slotGroups.map(([at, guests]) => {
              const covers = guests.reduce((sum, g) => sum + (g.bookingSize ?? 0), 0);
              return (
                <div key={at}>
                  <div className="sticky top-14 z-[5] -mx-1 mb-2 flex items-center gap-3 bg-surface-alt px-1 py-1.5">
                    <span className="text-lg font-black tabular-nums text-pickled-bluewood leading-none">
                      {clock(at)}
                    </span>
                    <span className="h-px flex-1 bg-platinum/70" />
                    <span className="text-xs text-ink-subtle tabular-nums">
                      {guests.length} {guests.length === 1 ? "booking" : "bookings"} · {covers} covers
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 items-start">
                    {guests.map((a) => (
                      <ArrivalCard key={a.customerRef} {...a} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {filtered && here.length === 0 && later.length === 0 ? (
        <div className="card p-5 text-sm text-ink-muted">
          No arrivals match those filters. Clear one to widen the view.
        </div>
      ) : null}

      <p className="text-xs text-ink-subtle text-center mt-4">
        Tap a row for the full profile · Refreshes every few seconds
      </p>
    </div>
  );
}

function Stat({
  number,
  label,
  accent = false,
}: {
  number: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={`card p-5 ${accent ? "bg-deep-purple text-white border-deep-purple" : ""}`}>
      <div className={`text-4xl font-black tabular-nums leading-none ${accent ? "text-neon-magenta" : "text-pickled-bluewood"}`}>
        {number}
      </div>
      <div className={`mt-2 section-label ${accent ? "text-white/70" : ""}`}>{label}</div>
    </div>
  );
}
