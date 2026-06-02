import { createHmac } from "crypto";
import type { AuditAdapter } from "./adapter";
import type { AuditAppendInput, AuditEntry } from "./types";

/**
 * In-memory mock audit log. Hash chain implemented faithfully so a reviewer can
 * see the tamper-evidence shape. Production swaps to an immutable store.
 */

const CHAIN_SECRET =
  process.env.FOH_AUDIT_SECRET ??
  "demo-only-audit-secret-replace-via-env-FOH_AUDIT_SECRET";

const log: AuditEntry[] = [];

function canonicalise(e: Omit<AuditEntry, "hash">): string {
  // Stable ordering of keys so the hash is reproducible.
  const ordered: Record<string, unknown> = {};
  for (const k of Object.keys(e).sort()) {
    ordered[k] = (e as Record<string, unknown>)[k];
  }
  return JSON.stringify(ordered);
}

function chainHash(prev: string | null, body: Omit<AuditEntry, "hash">): string {
  return createHmac("sha256", CHAIN_SECRET)
    .update(prev ?? "")
    .update("|")
    .update(canonicalise(body))
    .digest("hex");
}

export const auditMock: AuditAdapter = {
  async append(input) {
    const prev = log[log.length - 1] ?? null;
    const body: Omit<AuditEntry, "hash"> = {
      seq: (prev?.seq ?? 0) + 1,
      prevHash: prev?.hash ?? null,
      timestamp: Date.now(),
      ...input,
    };
    const hash = chainHash(prev?.hash ?? null, body);
    const entry: AuditEntry = { ...body, hash };
    log.push(entry);
    return entry;
  },

  async query(filter) {
    return log.filter((e) => {
      if (e.operatorId !== filter.operatorId) return false;
      if (filter.venueId && e.venueId !== filter.venueId) return false;
      if (filter.staffId && e.staffId !== filter.staffId) return false;
      if (filter.identifierHash && e.identifierHash !== filter.identifierHash) return false;
      if (filter.fromTs && e.timestamp < filter.fromTs) return false;
      if (filter.toTs && e.timestamp > filter.toTs) return false;
      return true;
    }).slice(0, filter.limit ?? 200);
  },

  async verifyChain(operatorId) {
    const entries = log.filter((e) => e.operatorId === operatorId);
    let prev: string | null = null;
    for (const e of entries) {
      const recomputed = chainHash(prev, {
        seq: e.seq,
        prevHash: e.prevHash,
        timestamp: e.timestamp,
        action: e.action,
        outcome: e.outcome,
        operatorId: e.operatorId,
        venueId: e.venueId,
        staffId: e.staffId,
        sessionId: e.sessionId,
        identifierHash: e.identifierHash,
        entitlementId: e.entitlementId,
        fallbackUsed: e.fallbackUsed,
        meta: e.meta,
      });
      if (recomputed !== e.hash) return { ok: false, brokeAtSeq: e.seq };
      prev = e.hash;
    }
    return { ok: true };
  },
};
