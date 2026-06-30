"use client";

import { useEffect, useState } from "react";
import { ArrivalCard } from "@/components/ArrivalCard";
import type { CriterionEvaluation } from "@/lib/arrival-criteria";

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
  arrivedAt: number;
  at: number;
  kind: "arrived" | "booking";
  source: string;
  bookingSize: number | null;
  triggered: CriterionEvaluation[];
};

export function ArrivalsClient() {
  const [arrivals, setArrivals] = useState<Arrival[] | null>(null);
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

  const triggerArrival = async (a: Arrival) => {
    setDemoBusy(a.customerRef);
    setDemoResult(null);
    const res = await fetch("/api/arrivals/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerRef: a.customerRef,
        bookingSize: a.bookingSize,
      }),
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

  const here = arrivals.filter((a) => a.kind === "arrived");
  const later = arrivals.filter((a) => a.kind === "booking");
  const priorityCount = arrivals.filter((a) =>
    a.triggered.some((t) => t.priority >= 80),
  ).length;

  return (
    <div className="space-y-5">
      <section className="hidden md:grid grid-cols-3 gap-4">
        <Stat number={here.length} label="Here now" />
        <Stat number={later.length} label="Coming later today" />
        <Stat
          number={priorityCount}
          label={priorityCount === 1 ? "Priority signal" : "Priority signals"}
          accent
        />
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
          {arrivals.map((a) => (
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
            <span className="text-xs text-ink-subtle md:hidden">{here.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {here.map((a) => (
              <ArrivalCard key={a.customerRef} {...a} />
            ))}
          </div>
        </section>
      ) : null}

      {later.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="section-label">Coming later today</h2>
            <span className="text-xs text-ink-subtle md:hidden">{later.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {later.map((a) => (
              <ArrivalCard key={a.customerRef} {...a} />
            ))}
          </div>
        </section>
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
