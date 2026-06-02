/**
 * Mock manager session. Real impl would use SSO and tie venue selection to the
 * manager's assigned sites.
 *
 * Spec alignment:
 *  - operatorId / venueId — multi-tenancy scope used by every adapter call (C1)
 *  - staffId — distinct from a display name, used in audit (L1.2)
 *  - sessionId — distinct per sign-in, used to bind verification tokens (V1.3)
 *  - A1.3 — sessions expire on idle (30 min) or shift end (12 h)
 */
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export type ManagerSession = {
  operatorId: string;
  /** Display name shown in UI. */
  managerName: string;
  /** Stable per-staff identifier used in audit logs. Distinct from name. */
  staffId: string;
  role: "gm" | "system_manager" | "floor_manager";
  venueName: string;
  /** Stable per-venue identifier. Mocked as a slug of the venue name. */
  venueId: string;
  /** Issued on sign-in, used to bind verification tokens. */
  sessionId: string;
  /** Unix ms when the session was issued. */
  issuedAt: number;
};

const COOKIE = "foh_session";

export async function getSession(): Promise<ManagerSession | null> {
  const c = await cookies();
  const raw = c.get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as ManagerSession;
  } catch {
    return null;
  }
}

export async function setSession(input: {
  managerName: string;
  role: "gm" | "system_manager" | "floor_manager";
  venueName: string;
}) {
  const c = await cookies();
  const session: ManagerSession = {
    operatorId: "op_demo",
    managerName: input.managerName,
    staffId: `staff_${slug(input.managerName)}`,
    role: input.role,
    venueName: input.venueName,
    venueId: `venue_${slug(input.venueName)}`,
    sessionId: randomBytes(12).toString("base64url"),
    issuedAt: Date.now(),
  };
  c.set(COOKIE, encodeURIComponent(JSON.stringify(session)), {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSession() {
  const c = await cookies();
  c.delete(COOKIE);
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const DEMO_VENUES = [
  "Arcado",
  "Arco",
  "Argento",
  "Argo",
  "Armado",
  "Arturo",
];

export const DEMO_MANAGERS = [
  { name: "Alex Rivers", role: "gm" as const },
  { name: "Sam Patel", role: "floor_manager" as const },
  { name: "Jordan Reed", role: "system_manager" as const },
];
