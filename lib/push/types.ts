import type { CriterionCode } from "@/lib/arrival-criteria";

/**
 * A device's serialised PushSubscription (the JSON shape the browser produces from
 * `pushManager.subscribe`). Stored server-side keyed by id.
 */
export type SerialisedPushSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushPreferences = {
  /** Which criteria the device wants to be notified for. */
  criteria: Record<CriterionCode, boolean>;
};

export type StoredSubscription = {
  id: string;
  /** Scope — push only fires for arrivals at this venue. */
  venueId: string;
  operatorId: string;
  staffId: string;
  subscription: SerialisedPushSubscription;
  preferences: PushPreferences;
  createdAt: number;
};

export type PushPayload = {
  /** Headline shown as notification title. */
  title: string;
  body: string;
  /** Click-through URL. */
  url: string;
  /** Tag for deduping repeat pings for the same arrival. */
  tag: string;
  /** Optional badge text shown in app icon (Android only). */
  badge?: string;
};
