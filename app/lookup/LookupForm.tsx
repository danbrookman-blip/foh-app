"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LookupForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        const res = await fetch("/api/customers/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: value }),
        });
        const data = await res.json();
        setSubmitting(false);
        if (!res.ok) {
          setError(
            data?.error === "invalid_identifier"
              ? "That doesn't look like a mobile or email."
              : "Something went wrong.",
          );
          return;
        }
        if (!data.match) {
          // Spec F1.3 — wording is "no entitlements found", not "guest not in system".
          router.push(`/lookup/results?status=nomatch&id=${encodeURIComponent(value)}`);
          return;
        }
        // Pass identifier kind + hash forward so the verification flow can lock
        // the channel (V1.4) and bind the token to the lookup (V1.3).
        const params = new URLSearchParams({
          ref: data.customerRef,
          kind: data.identifierKind,
          hash: data.identifierHash,
        });
        router.push(`/lookup/results?${params.toString()}`);
      }}
      className="space-y-4"
    >
      <input
        autoFocus
        inputMode="email"
        className="field text-lg"
        placeholder="Mobile or email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {error ? <div className="text-sm text-accent">{error}</div> : null}
      <button className="btn-primary w-full text-lg" disabled={!value.trim() || submitting}>
        {submitting ? "Looking up…" : "Look up"}
      </button>
    </form>
  );
}
