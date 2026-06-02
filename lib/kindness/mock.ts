import { randomUUID } from "crypto";
import { CATALOG, findAward } from "./catalog";
import type { KindnessAdapter } from "./adapter";
import type { AwardCode, KindnessCatalogEntry, KindnessGrant } from "./types";

const DAY = 86_400_000;
const now = Date.now();

/**
 * Seeded prior grants so the demo opens with realistic quota usage and at least
 * one customer who already has a recent treat (so managers see the "don't pile on"
 * inline note immediately).
 */
const GRANTS: KindnessGrant[] = [
  {
    id: "g_seed_1",
    awardCode: "free_coffee",
    customerRef: "c_sarah",
    recipientLabel: "Sarah M.",
    venueName: "Arcado",
    managerName: "Sam Patel",
    grantedAt: now - 14 * DAY,
  },
  {
    id: "g_seed_2",
    awardCode: "fifty_off_bill",
    customerRef: "c_ben",
    recipientLabel: "Ben T.",
    venueName: "Arcado",
    managerName: "Alex Rivers",
    grantedAt: now - 22 * DAY,
  },
  {
    id: "g_seed_3",
    awardCode: "free_coffee",
    customerRef: null,
    recipientLabel: "Walk-in at bar",
    venueName: "Arcado",
    managerName: "Alex Rivers",
    grantedAt: now - 2 * DAY,
  },
  {
    id: "g_seed_4",
    awardCode: "free_cocktail",
    customerRef: null,
    recipientLabel: "Table 12",
    venueName: "Arcado",
    managerName: "Sam Patel",
    grantedAt: now - 5 * DAY,
  },
  {
    id: "g_seed_5",
    awardCode: "free_main",
    customerRef: null,
    recipientLabel: "Anniversary couple, table 3",
    venueName: "Arcado",
    managerName: "Alex Rivers",
    grantedAt: now - 9 * DAY,
  },
  {
    id: "g_seed_6",
    awardCode: "free_cake",
    customerRef: null,
    recipientLabel: "Birthday surprise, table 7",
    venueName: "Arcado",
    managerName: "Sam Patel",
    grantedAt: now - 18 * DAY,
  },
  {
    id: "g_seed_7",
    awardCode: "free_cocktail",
    customerRef: null,
    recipientLabel: "Recovery, kitchen delay",
    venueName: "Arcado",
    managerName: "Alex Rivers",
    grantedAt: now - 12 * DAY,
  },
];

function isThisMonth(ts: number): boolean {
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}

function countThisMonth(venueName: string, code: AwardCode): number {
  return GRANTS.filter(
    (g) => g.venueName === venueName && g.awardCode === code && isThisMonth(g.grantedAt),
  ).length;
}

export const kindnessMock: KindnessAdapter = {
  async getCatalog(venueName) {
    return CATALOG.map<KindnessCatalogEntry>((a) => {
      const used = countThisMonth(venueName, a.code);
      return {
        ...a,
        usedThisMonth: used,
        remaining: Math.max(0, a.monthlyLimit - used),
      };
    });
  },

  async getRecentForCustomer(customerRef, limit = 5) {
    return GRANTS.filter((g) => g.customerRef === customerRef)
      .sort((a, b) => b.grantedAt - a.grantedAt)
      .slice(0, limit);
  },

  async grant(input) {
    const award = findAward(input.awardCode);
    if (!award) return { ok: false, reason: "unknown_award" };
    const used = countThisMonth(input.venueName, input.awardCode);
    if (used >= award.monthlyLimit) return { ok: false, reason: "quota_exhausted" };
    const g: KindnessGrant = {
      id: `g_${randomUUID()}`,
      awardCode: input.awardCode,
      customerRef: input.customerRef,
      recipientLabel: input.recipientLabel,
      venueName: input.venueName,
      managerName: input.managerName,
      grantedAt: Date.now(),
    };
    GRANTS.unshift(g);
    return { ok: true, grant: g };
  },
};
