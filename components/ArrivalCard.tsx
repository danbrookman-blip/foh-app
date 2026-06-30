"use client";

import { useState } from "react";
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
  /** Distinguishes a current arrival from a future booking. */
  kind?: "arrived" | "booking";
};

/**
 * Arrival card — collapsed by default to a one-line row (name + pills + time).
 * Tap to expand to the full profile: insight, signal grid, kindness, notes.
 *
 * Heavy nested panels (Notes / Kindness) only mount when the card expands, so
 * the feed stays cheap to render even with a long list of incoming guests.
 */
export function ArrivalCard(props: Props) {
  const [expanded, setExpanded] = useState(false);

  const extraTriggered = (props.triggered ?? []).filter(
    (t) => t.code !== "vip" && t.code !== "birthday_month" && t.code !== "at_risk",
  );
  const isPriority = (props.triggered ?? []).some((t) => t.priority >= 80);
  const kind = props.kind ?? (props.arrivedAt ? "arrived" : undefined);

  return (
    <div
      id={props.arrivedAt ? props.customerRef : undefined}
      className={`card overflow-hidden transition ${isPriority ? "ring-2 ring-warm-purple/40" : ""}`}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-surface-tint/40 transition"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-base font-bold text-ink">{props.displayName}</span>
            <TierPill tier={props.tier} />
            {props.birthdayThisMonth ? (
              <span className="pill-accent">🎂</span>
            ) : null}
            {extraTriggered.map((t) => (
              <span key={t.code} className="pill-warn">
                {t.label}
              </span>
            ))}
            {kind === "booking" ? <span className="pill-mute">Booking</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TimeBadge at={props.arrivedAt} kind={kind} />
          <Chevron open={expanded} />
        </div>
      </button>

      {expanded ? (
        <div className="px-4 pb-4 border-t border-platinum/60">
          {kind ? (
            <div className="text-xs text-ink-subtle pt-3">
              {kind === "arrived"
                ? `${props.source === "wifi" ? "Wi-Fi sign-in" : "Reservation match"}${
                    props.bookingSize ? ` · party of ${props.bookingSize}` : ""
                  }`
                : `Booked${props.bookingSize ? ` · party of ${props.bookingSize}` : ""}`}
            </div>
          ) : null}

          {props.insight ? (
            <div className="mt-3 rounded-xl2 bg-surface-tint border border-accent-soft px-3 py-2.5 flex gap-2.5 items-start">
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
      ) : null}
    </div>
  );
}

function TimeBadge({ at, kind }: { at?: number; kind?: "arrived" | "booking" }) {
  if (!at) return null;
  if (kind === "booking") {
    const t = new Date(at).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return <span className="text-sm font-semibold text-ink tabular-nums">{t}</span>;
  }
  return (
    <span className="text-sm text-ink-muted tabular-nums">{relativePast(at)}</span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`text-ink-subtle transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function relativePast(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const min = Math.round(diff / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  return `${hr} hr ago`;
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
