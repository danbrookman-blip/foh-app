"use client";

import { useEffect, useState } from "react";
import { ArrivalCard } from "@/components/ArrivalCard";

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
};

export function ArrivalsClient() {
  const [arrivals, setArrivals] = useState<Arrival[] | null>(null);

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

  if (!arrivals) return <div className="text-ink-muted text-sm">Loading…</div>;
  if (arrivals.length === 0)
    return (
      <div className="card p-5 text-sm text-ink-muted">
        No known customers in yet. They'll appear here as they connect to Wi-Fi or check in.
      </div>
    );

  return (
    <div className="space-y-3">
      {arrivals.map((a) => (
        <ArrivalCard key={a.customerRef + a.arrivedAt} {...a} />
      ))}
      <p className="text-xs text-ink-subtle text-center mt-4">
        Refreshes every few seconds · No personal data shown beyond first name + initial.
      </p>
    </div>
  );
}
