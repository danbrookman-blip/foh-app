/**
 * Mock manager session. The prototype keeps the active venue + manager in a cookie
 * read by both server routes and the UI shell. Real impl would back with an
 * identity provider (SSO, magic-link auth) and tie venue selection to the manager's
 * assigned sites.
 */
import { cookies } from "next/headers";

export type ManagerSession = {
  managerName: string;
  role: "gm" | "system_manager" | "floor_manager";
  venueName: string;
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

export async function setSession(session: ManagerSession) {
  const c = await cookies();
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

export const DEMO_VENUES = [
  "The Lamb & Flag, Soho",
  "The Old Brewery, Greenwich",
  "Riverside Kitchen, Bath",
];

export const DEMO_MANAGERS = [
  { name: "Alex Rivers", role: "gm" as const },
  { name: "Sam Patel", role: "floor_manager" as const },
  { name: "Jordan Reed", role: "system_manager" as const },
];
