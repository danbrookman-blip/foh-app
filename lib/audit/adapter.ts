import type { AuditAppendInput, AuditEntry } from "./types";

export interface AuditAdapter {
  /** Append a new entry. Sequence and hash chain are computed by the adapter. */
  append(entry: AuditAppendInput): Promise<AuditEntry>;
  /** Query for a date range / staff / venue. Used by export. */
  query(filter: {
    operatorId: string;
    venueId?: string;
    staffId?: string;
    identifierHash?: string;
    fromTs?: number;
    toTs?: number;
    limit?: number;
  }): Promise<AuditEntry[]>;
  /** Verify the chain is intact — every prevHash matches the prior entry's hash. */
  verifyChain(operatorId: string): Promise<{ ok: true } | { ok: false; brokeAtSeq: number }>;
}
