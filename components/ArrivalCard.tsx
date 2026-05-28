import { TierPill } from "./TierPill";

type Props = {
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

/**
 * Arrival card — the Strava-for-hospitality moment. Five signal slots, no more.
 * Anything beyond five is noise to a manager who's about to walk the floor.
 */
export function ArrivalCard(props: Props) {
  const minsAgo = Math.max(1, Math.round((Date.now() - props.arrivedAt) / 60000));
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold">{props.displayName}</span>
            <TierPill tier={props.tier} />
            {props.birthdayThisMonth ? (
              <span className="pill-accent">🎂 Birthday month</span>
            ) : null}
          </div>
          <div className="text-xs text-ink-subtle mt-0.5">
            Arrived {minsAgo} min ago · {props.source === "wifi" ? "Wi-Fi sign-in" : "Reservation match"}
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Signal label="Last visit" value={relative(props.lastVisitAt)} />
        <Signal label="Last 90 days" value={`${props.visitsLast90Days} visits`} />
        <Signal label="Lifetime" value={`${props.lifetimeVisits} visits`} />
        <Signal label="Usually orders" value={props.lastItemOrdered} />
      </dl>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-subtle">{label}</dt>
      <dd className="font-semibold text-ink mt-0.5">{value}</dd>
    </div>
  );
}

function relative(ts: number) {
  const diff = Date.now() - ts;
  const day = 86_400_000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  const days = Math.round(diff / day);
  if (days < 14) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `${weeks} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}
