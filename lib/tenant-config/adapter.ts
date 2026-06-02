import type { SignalOptOut, TenantConfig } from "./types";

export interface TenantConfigAdapter {
  getConfig(operatorId: string): Promise<TenantConfig | null>;
  /** Used by the signal layer to filter notifications (spec P3.3). */
  isOptedOutOfSignals(operatorId: string, identifierHash: string): Promise<boolean>;
  /** Customer opt-out endpoint would hit this. Not wired into UI in prototype. */
  recordSignalOptOut(operatorId: string, optOut: SignalOptOut): Promise<{ ok: boolean }>;
}
