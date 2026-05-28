"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddCustomerForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    consentMarketing: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="card p-6 text-center bg-ok-soft border-ok/20">
        <div className="text-4xl mb-2">✓</div>
        <div className="text-lg font-semibold text-ok">Customer added</div>
        <p className="text-sm text-ink-muted mt-1">
          Airship will send their welcome. You're done — go back to looking after them.
        </p>
        <button className="btn-primary w-full mt-5" onClick={() => router.push("/lookup")}>
          Back to lookup
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        const res = await fetch("/api/customers/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json().catch(() => ({}));
        setSubmitting(false);
        if (!res.ok) {
          setError(
            data?.error === "duplicate"
              ? "Already on file — try looking them up by mobile or email."
              : data?.error === "invalid_contact"
              ? "Mobile or email doesn't look right."
              : "Something went wrong.",
          );
          return;
        }
        setDone(true);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <input
          required
          className="field"
          placeholder="First name"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <input
          required
          className="field"
          placeholder="Last name"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
      </div>
      <input
        required
        type="tel"
        inputMode="tel"
        className="field"
        placeholder="Mobile"
        value={form.mobile}
        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
      />
      <input
        required
        type="email"
        inputMode="email"
        className="field"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl2 bg-white">
        <input
          type="checkbox"
          checked={form.consentMarketing}
          onChange={(e) => setForm({ ...form, consentMarketing: e.target.checked })}
          className="mt-1 h-5 w-5"
        />
        <span className="text-sm">
          They're happy to hear from us — offers, events, birthday treats.
          <span className="block text-xs text-ink-muted mt-0.5">
            Required for Airship marketing campaigns. They can opt out at any time.
          </span>
        </span>
      </label>
      {error ? <div className="text-sm text-accent">{error}</div> : null}
      <button className="btn-primary w-full text-lg" disabled={submitting}>
        {submitting ? "Saving…" : "Add to Airship"}
      </button>
    </form>
  );
}
