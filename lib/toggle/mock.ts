import { findSeedByIdentifier } from "@/lib/seeds";
import type { ToggleAdapter } from "./adapter";
import type { GiftCard } from "./types";

const DAY = 86_400_000;
const now = Date.now();

type StoredGiftCard = GiftCard & { customerRef: string };

const GIFT_CARDS: StoredGiftCard[] = [
  {
    id: "gc_sarah_1",
    customerRef: "c_sarah",
    maskedCode: "•••• 8821",
    balancePence: 4500,
    expiresAt: now + 365 * DAY,
  },
  {
    id: "gc_ben_1",
    customerRef: "c_ben",
    maskedCode: "•••• 1147",
    balancePence: 1000,
    expiresAt: now + 180 * DAY,
  },
  {
    id: "gc_priya_1",
    customerRef: "c_priya",
    maskedCode: "•••• 7732",
    balancePence: 10000,
    expiresAt: now + 540 * DAY,
  },
];

const authorisedIds = new Set<string>();

function pause(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const toggleMock: ToggleAdapter = {
  async lookup(identifier) {
    await pause(280);
    const seed = findSeedByIdentifier(identifier.kind, identifier.value);
    if (!seed) return { match: false };
    const cards = GIFT_CARDS.filter(
      (g) => g.customerRef === seed.ref && !authorisedIds.has(g.id),
    ).map(({ customerRef, ...g }) => g);
    if (cards.length === 0) return { match: true, toggleRef: seed.ref, giftCards: [] };
    return { match: true, toggleRef: seed.ref, giftCards: cards };
  },

  async getGiftCards(toggleRef) {
    return GIFT_CARDS.filter(
      (g) => g.customerRef === toggleRef && !authorisedIds.has(g.id),
    ).map(({ customerRef: _r, ...g }) => g);
  },

  async markGiftCardAuthorised(_toggleRef, giftCardId) {
    const card = GIFT_CARDS.find((g) => g.id === giftCardId);
    if (!card) return { ok: false };
    authorisedIds.add(giftCardId);
    return { ok: true };
  },
};
