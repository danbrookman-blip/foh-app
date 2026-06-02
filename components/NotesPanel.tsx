"use client";

import { useCallback, useEffect, useState } from "react";
import { useVoiceDictation } from "./useVoiceDictation";

type Note = {
  id: string;
  body: string;
  authorName: string;
  venueName: string;
  createdAt: number;
};

const MAX = 500;

export function NotesPanel({
  customerRef,
  displayName,
}: {
  customerRef: string;
  displayName: string;
}) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Voice dictation — appends final chunks to whatever the manager has typed.
  const onFinalChunk = useCallback((chunk: string) => {
    setDraft((prev) => {
      const sep = prev && !prev.endsWith(" ") ? " " : "";
      const next = prev + sep + chunk;
      return next.slice(0, MAX);
    });
  }, []);
  const voice = useVoiceDictation({ onFinal: onFinalChunk });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/notes/${customerRef}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setNotes(d.notes ?? []);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [customerRef]);

  const count = notes?.length ?? 0;

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <button
        type="button"
        className="w-full flex items-center justify-between text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-ink">
          Notes
          {count > 0 ? (
            <span className="ml-2 pill-mute">{count}</span>
          ) : (
            <span className="ml-2 text-ink-subtle font-normal">— none yet</span>
          )}
        </span>
        <span className="text-ink-subtle text-sm">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <div className="mt-3 space-y-3">
          {count > 0 ? (
            <ul className="space-y-2">
              {notes!.map((n) => (
                <li key={n.id} className="rounded-xl2 bg-surface-alt p-3">
                  <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                  <div className="mt-1.5 text-xs text-ink-subtle">
                    {n.authorName} · {n.venueName} · {relative(n.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {composing ? (
            <div>
              <div className="relative">
                <textarea
                  autoFocus
                  className={`field min-h-[88px] text-base pr-14 ${
                    voice.listening ? "ring-4 ring-accent/30 border-accent" : ""
                  }`}
                  placeholder={
                    voice.listening
                      ? "Listening… speak in plain English, GB."
                      : `Type or hit the mic. Anything worth knowing about ${displayName.split(" ")[0]} next time — preferences, seating, how they like their drink. (Dietary or allergen info belongs in the kitchen system, not here.)`
                  }
                  value={draft + (voice.interim ? (draft && !draft.endsWith(" ") ? " " : "") + voice.interim : "")}
                  maxLength={MAX}
                  onChange={(e) => setDraft(e.target.value)}
                  readOnly={voice.listening}
                />
                <MicButton
                  supported={voice.supported}
                  listening={voice.listening}
                  onClick={() => (voice.listening ? voice.stop() : voice.start())}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs text-ink-subtle">
                <span>
                  {draft.length}/{MAX}
                  {voice.listening ? <span className="ml-2 text-accent font-medium">● recording</span> : null}
                </span>
                <span>Visible to all managers at this venue.</span>
              </div>
              {voice.error ? (
                <div className="text-sm text-accent mt-2">{voice.error}</div>
              ) : null}
              {!voice.supported && !voice.error ? (
                <div className="text-xs text-ink-muted mt-2">
                  Voice input isn't supported on this browser. Type it instead, or open
                  the app in Chrome or Safari.
                </div>
              ) : null}
              {error ? <div className="text-sm text-accent mt-2">{error}</div> : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    voice.stop();
                    setComposing(false);
                    setDraft("");
                    setError(null);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!draft.trim() || submitting || voice.listening}
                  onClick={async () => {
                    setSubmitting(true);
                    setError(null);
                    const res = await fetch(`/api/notes/${customerRef}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ body: draft }),
                    });
                    setSubmitting(false);
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      setError(
                        data?.error === "not_authenticated"
                          ? "You've been signed out — refresh and sign in again."
                          : data?.error === "too_long"
                          ? `Notes are capped at ${MAX} characters.`
                          : "Couldn't save. Try again.",
                      );
                      return;
                    }
                    const { note } = (await res.json()) as { note: Note };
                    setNotes((prev) => [note, ...(prev ?? [])]);
                    setDraft("");
                    setComposing(false);
                  }}
                >
                  {submitting ? "Saving…" : "Save note"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn-ghost w-full"
              onClick={() => setComposing(true)}
            >
              + Take a note
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MicButton({
  supported,
  listening,
  onClick,
}: {
  supported: boolean;
  listening: boolean;
  onClick: () => void;
}) {
  const disabled = !supported;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      title={
        disabled
          ? "Voice input not supported on this browser"
          : listening
          ? "Stop voice input"
          : "Start voice input"
      }
      className={`absolute right-2 bottom-2 h-10 w-10 rounded-full flex items-center justify-center transition shadow-pop ${
        disabled
          ? "bg-navy-100 text-ink-subtle cursor-not-allowed shadow-none"
          : listening
          ? "bg-accent text-white animate-pulse"
          : "bg-white border border-navy-100 text-ink hover:border-accent hover:text-accent"
      }`}
    >
      {listening ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" strokeLinecap="round" />
          <path d="M12 18v3" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

function relative(ts: number) {
  const diff = Date.now() - ts;
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < hr) return `${Math.max(1, Math.round(diff / min))} min ago`;
  if (diff < day) return `${Math.round(diff / hr)} hr ago`;
  const days = Math.round(diff / day);
  if (days < 14) return `${days} d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 8) return `${weeks} wk ago`;
  return `${Math.round(days / 30)} mo ago`;
}
