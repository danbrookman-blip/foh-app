import type { FeedbackInput, FeedbackRecord } from "./types";

/**
 * HgemAdapter — the seam between the app and the analytics destination.
 *
 * Why this is an adapter: HGEM's public Results API is read-only. So `submitFeedback`
 * has two realistic production wirings:
 *
 *   1. A partner write endpoint at HGEM (contractual; ask your HGEM rep) — implement
 *      this interface against that.
 *   2. Your own data warehouse / event bus (S3 + Athena, BigQuery, Snowflake, etc.) —
 *      writes rows in the HGEM-compatible shape so they join with the Kleene-ingested
 *      HGEM visit data downstream. This is the default recommendation.
 *
 * To swap: implement this interface in `lib/hgem/hgem-client.ts` (or `warehouse-client.ts`)
 * and re-export from `lib/hgem/index.ts`. UI never touches the client.
 */
export interface HgemAdapter {
  submitFeedback(
    input: FeedbackInput,
    context: { customerRef: string; branchId: string; branchName: string },
  ): Promise<{ ok: true; record: FeedbackRecord } | { ok: false; reason: string }>;
  /** Recent feedback for an audit / debug view. Not exposed in floor UI. */
  recent(limit?: number): Promise<FeedbackRecord[]>;
}
