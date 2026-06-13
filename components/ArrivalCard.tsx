import { TierPill } from "./TierPill";
import { NotesPanel } from "./NotesPanel";
import { KindnessPanel } from "./KindnessPanel";
import type { CriterionEvaluation } from "@/lib/arrival-criteria";

type Props = {
  customerRef: string;
  displayName: string;
  tier: "new" | "regular" | "vip" | "at-risk" | "recovery";
  lastVisitAt: number;
  visitsLast90Days: number;
  lifetimeVisits: number;
  favouriteCategory: string;
  lastItemOrdered: string;
  birthdayThisMonth: boolean;
  /** Arrival-event metadata. Omit when rendering outside the arrivals feed. */
  arrivedAt?: number;
  source?: string;
  bookingSize?: number | null;
  triggered?: CriterionEvaluation[];
  /** Strava-style observational snippet — one sentence, narrative. */
  insight?: string;
};

/**
 * Arrival card. The five signal slots stay deterministic, but the criteria
 * engine output is overlaid as pills at the top — that's the signal the manager
 * uses to decide whether to walk over.
 */
export function ArrivalCard(props: Props) {
  const hasArrival = typeof props.arrivedAt === "number";
  const minsAgo = hasArrival
    ? Math.max(1, Math.round((Date.now() - (props.arrivedAt as number)) / 60000))
    : null;
  // Drop the duplicates already conveyed by TierPill / birthday flag.
  const extraTriggered = (props.triggered ?? []).filter(
    (t) => t.code !== "vip" && t.code !== "birthday_month" && t.code !== "at_risk",
  );
  const isPriority = (props.triggered ?? []).some((t) => t.priority >= 80);

  return (
    <div
      id={hasArrival ? props.customerRef : undefined}
      className={`card p-4 ${isPriority ? "ring-2 ring-warm-purple/40" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-semibold">{props.displayName}</span>
            <TierPill tier={props.tier} />
            {props.birthdayThisMonth ? (
              <span className="pill-accent">🎂 Birthday month</span>
            ) : null}
            {extraTriggered.map((t) => (
              <span key={t.code} className="pill-warn">
                {t.label}
              </span>
            ))}
          </div>
          {hasArrival ? (
            <div className="text-xs text-ink-subtle mt-0.5">
              Arrived {minsAgo} min ago · {props.source === "wifi" ? "Wi-Fi sign-in" : "Reservation match"}
              {props.bookingSize ? ` · party of ${props.bookingSize}` : ""}
            </div>
          ) : null}
        </div>
      </div>

      {props.insight ? (
        <div className="mt-4 rounded-xl2 bg-surface-tint border border-accent-soft px-3 py-2.5 flex gap-2.5 items-start">
          <span aria-hidden className="text-warm-purple mt-0.5 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="section-label text-warm-purple">Insight</div>
            <p className="text-sm text-ink leading-snug mt-0.5">{props.insight}</p>
          </div>
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Signal label="Last visit" value={relative(props.lastVisitAt)} />
        <Signal label="Last 90 days" value={`${props.visitsLast90Days} visits`} />
        <Signal label="Lifetime" value={`${props.lifetimeVisits} visits`} />
        <Signal label="Usually orders" value={props.lastItemOrdered} />
      </dl>

      <KindnessPanel customerRef={props.customerRef} displayName={props.displayName} />
      <NotesPanel customerRef={props.customerRef} displayName={props.displayName} />
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
