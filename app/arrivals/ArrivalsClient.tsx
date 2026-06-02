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
  source: string;
  bookingSize: number | null;
  triggered: CriterionEvaluation[];
};

export function ArrivalsClient() {
  const [arrivals, setArrivals] = useState<Arrival[] | null>(null);
  const [demoOpen, setDemoOpen] = useState(false);
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

  return (
    <div className="space-y-4">
      <details
        className="card p-4"
        open={demoOpen}
        onToggle={(e) => setDemoOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="text-sm font-semibold cursor-pointer">
          Demo controls — simulate an arrival
        </summary>
        <p className="text-xs text-ink-muted mt-2">
          In production, arrivals fire from Wi-Fi sign-in or a reservation webhook.
          Here you can trigger one manually to see the criteria evaluate and the push fire.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {(arrivals ?? []).map((a) => (
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

      {arrivals === null ? (
        <div className="text-ink-muted text-sm">Loading…</div>
      ) : arrivals.length === 0 ? (
        <div className="card p-5 text-sm text-ink-muted">
          No known customers in yet. They'll appear here as they connect to Wi-Fi or check in.
        </div>
      ) : (
        <div className="space-y-3">
          {arrivals.map((a) => (
            // Key on customerRef alone — arrivedAt is recomputed on every poll,
            // so including it forces every card to remount every 8s, blowing away
            // notes/kindness/voice state.
            <ArrivalCard key={a.customerRef} {...a} />
          ))}
          <p className="text-xs text-ink-subtle text-center mt-4">
            Refreshes every few seconds · No personal data shown beyond first name + initial.
          </p>
        </div>
      )}
    </div>
  );
}
