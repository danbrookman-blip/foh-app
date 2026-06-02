import type { TenantConfigAdapter } from "./adapter";
import type { SignalOptOut, TenantConfig } from "./types";

const TENANTS: Record<string, TenantConfig> = {
  op_demo: {
    operatorId: "op_demo",
    displayName: "Demo Operator",
    signalToggles: {
      recency: true,
      frequency: true,
      spend_bracket: true,
      last_item: true,
      birthday_month: true,
    },
    signalOptOuts: [],
    verificationExpiryMs: 5 * 60 * 1000,
  },
};

export const tenantConfigMock: TenantConfigAdapter = {
  async getConfig(operatorId) {
    return TENANTS[operatorId] ?? null;
  },
  async isOptedOutOfSignals(operatorId, identifierHash) {
    const t = TENANTS[operatorId];
    if (!t) return false;
    return t.signalOptOuts.some((o) => o.identifierHash === identifierHash);
  },
  async recordSignalOptOut(operatorId, optOut: SignalOptOut) {
    const t = TENANTS[operatorId];
    if (!t) return { ok: false };
    t.signalOptOuts.push(optOut);
    return { ok: true };
  },
};
