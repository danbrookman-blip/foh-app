import { randomBytes } from "crypto";
import type { CriterionCode } from "@/lib/arrival-criteria";
import type { PushPreferences, SerialisedPushSubscription, StoredSubscription } from "./types";

/**
 * In-memory store for the prototype. Production swaps to a DB table keyed by
 * endpoint URL — deduped per device.
 */
const subscriptions = new Map<string, StoredSubscription>();

export function upsertSubscription(input: {
  venueId: string;
  operatorId: string;
  staffId: string;
  subscription: SerialisedPushSubscription;
  preferences: PushPreferences;
}): StoredSubscription {
  // Endpoint uniquely identifies the device — same device re-subscribing should
  // update, not duplicate.
  const existing = [...subscriptions.values()].find(
    (s) => s.subscription.endpoint === input.subscription.endpoint,
  );
  if (existing) {
    existing.preferences = input.preferences;
    existing.venueId = input.venueId;
    existing.staffId = input.staffId;
    return existing;
  }
  const id = `sub_${randomBytes(8).toString("base64url")}`;
  const stored: StoredSubscription = {
    id,
    venueId: input.venueId,
    operatorId: input.operatorId,
    staffId: input.staffId,
    subscription: input.subscription,
    preferences: input.preferences,
    createdAt: Date.now(),
  };
  subscriptions.set(id, stored);
  return stored;
}

export function removeByEndpoint(endpoint: string): boolean {
  for (const [id, s] of subscriptions) {
    if (s.subscription.endpoint === endpoint) {
      subscriptions.delete(id);
      return true;
    }
  }
  return false;
}

/**
 * Find subscriptions interested in receiving a push for a given venue and
 * triggered criteria. A subscription matches if ANY of the triggered criteria
 * is in its preferences set (OR semantics).
 */
export function findRecipients(input: {
  operatorId: string;
  venueId: string;
  triggeredCriteria: CriterionCode[];
}): StoredSubscription[] {
  return [...subscriptions.values()].filter((s) => {
    if (s.operatorId !== input.operatorId) return false;
    if (s.venueId !== input.venueId) return false;
    return input.triggeredCriteria.some((c) => s.preferences.criteria[c]);
  });
}

export function listSubscriptions(venueId: string): StoredSubscription[] {
  return [...subscriptions.values()].filter((s) => s.venueId === venueId);
}

export function findByEndpoint(endpoint: string): StoredSubscription | null {
  return [...subscriptions.values()].find((s) => s.subscription.endpoint === endpoint) ?? null;
}
