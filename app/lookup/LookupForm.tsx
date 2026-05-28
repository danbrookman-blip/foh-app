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
          setError(data?.error === "invalid_identifier" ? "That doesn't look like a mobile or email." : "Something went wrong.");
          return;
        }
        if (!data.match) {
          router.push(`/lookup/results?status=nomatch&id=${encodeURIComponent(value)}`);
          return;
        }
        router.push(`/lookup/results?ref=${data.customerRef}`);
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
