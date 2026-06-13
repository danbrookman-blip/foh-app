/**
 * Real Airship public-API client.
 *
 * Source: https://developers.airship.co.uk
 *
 * Currently implements the contact lookup primitive only. Other adapter methods
 * (getVouchers, sendMessage, registerCustomer, etc.) are not in the public API
 * surface and need partner-API access from Airship engineering — see the
 * handover plan's pre-build gotchas G1.1–G1.3.
 *
 * Auth: Bearer token from a Personal Access Token issued in the Airship dashboard.
 * Endpoint: GET https://api.airship.co.uk/v1/contacts?account_id=...&mobile_number=...
 *
 * Required env vars (all optional — if unset, this client is dormant and the
 * mock handles everything):
 *   AIRSHIP_PAT           — Bearer token from the Airship dashboard
 *   AIRSHIP_ACCOUNT_ID    — account id to scope the lookup to
 *   AIRSHIP_API_BASE_URL  — optional override, defaults to https://api.airship.co.uk/v1
 */

const BASE_URL = process.env.AIRSHIP_API_BASE_URL ?? "https://api.airship.co.uk/v1";
const PAT = process.env.AIRSHIP_PAT ?? "";
const ACCOUNT_ID = process.env.AIRSHIP_ACCOUNT_ID ?? "";

export function isAirshipConfigured(): boolean {
  return Boolean(PAT && ACCOUNT_ID);
}

/**
 * Loose response shape — defensively parsed because the public docs are thin on
 * exact field names. Adjust here once we have a sample response from a real call.
 */
export type RawAirshipContact = {
  id?: string | number;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  email?: string;
  mobile_number?: string;
  mobileNumber?: string;
};

function extractContact(data: unknown): RawAirshipContact | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  // Possible shapes: { contact: {...} }, { contacts: [{...}] }, [ {...} ], or {...}
  if (Array.isArray(d)) return (d[0] as RawAirshipContact) ?? null;
  if (Array.isArray(d.contacts)) return (d.contacts[0] as RawAirshipContact) ?? null;
  if (d.contact && typeof d.contact === "object") return d.contact as RawAirshipContact;
  // Assume top-level is the contact itself
  if (typeof d.id === "string" || typeof d.id === "number") return d as RawAirshipContact;
  return null;
}

export async function fetchAirshipContact(identifier: {
  kind: "mobile" | "email";
  value: string;
}): Promise<RawAirshipContact | null> {
  if (!isAirshipConfigured()) return null;

  const params = new URLSearchParams({ account_id: ACCOUNT_ID });
  if (identifier.kind === "mobile") params.set("mobile_number", identifier.value);
  else params.set("email", identifier.value);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/contacts?${params}`, {
      headers: {
        Authorization: `Bearer ${PAT}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (e) {
    console.warn("[airship-client] network error during contact lookup", e);
    return null;
  }

  if (res.status === 404) return null;
  if (res.status === 401 || res.status === 403) {
    console.warn(`[airship-client] auth ${res.status} — check AIRSHIP_PAT and AIRSHIP_ACCOUNT_ID`);
    return null;
  }
  if (!res.ok) {
    console.warn(`[airship-client] contact lookup ${res.status}`);
    return null;
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    return null;
  }
  return extractContact(body);
}

export function airshipContactToRef(contact: RawAirshipContact): string {
  // Prefix so the rest of the prototype can distinguish real Airship refs from
  // seeded mock refs (which are c_<name>). getVouchers / getSignals will return
  // empty/null for these — vouchers-per-contact isn't in the public API.
  return `airship_${contact.id ?? "unknown"}`;
}
