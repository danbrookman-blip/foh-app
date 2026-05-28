"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Manager = { name: string; role: "gm" | "system_manager" | "floor_manager" };

export function LoginForm({ managers, venues }: { managers: Manager[]; venues: string[] }) {
  const router = useRouter();
  const [manager, setManager] = useState(managers[0]);
  const [venue, setVenue] = useState(venues[0]);
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerName: manager.name,
            role: manager.role,
            venueName: venue,
          }),
        });
        router.refresh();
        router.push("/lookup");
      }}
      className="space-y-4"
    >
      <div>
        <label className="text-sm font-medium block mb-1.5">Who's on?</label>
        <select
          className="field"
          value={manager.name}
          onChange={(e) => {
            const m = managers.find((mm) => mm.name === e.target.value);
            if (m) setManager(m);
          }}
        >
          {managers.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name} — {roleLabel(m.role)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1.5">Tonight's venue</label>
        <select className="field" value={venue} onChange={(e) => setVenue(e.target.value)}>
          {venues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <button className="btn-primary w-full text-lg" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-xs text-ink-subtle text-center">
        Demo sign-in. Production would use your existing SSO / staff login.
      </p>
    </form>
  );
}

function roleLabel(r: Manager["role"]) {
  if (r === "gm") return "GM";
  if (r === "system_manager") return "System Manager";
  return "Floor Manager";
}
