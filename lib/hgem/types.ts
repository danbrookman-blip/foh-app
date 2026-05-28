/**
 * HGEM-compatible feedback types.
 *
 * Why these field names: HGEM exposes a read-only Results API (Branches, Visits, Menus)
 * that platforms like Kleene already pull from. By storing our first-party feedback in a
 * shape that mirrors HGEM's "visit" concept, the rows join cleanly with HGEM survey data
 * in the warehouse without schema reconciliation.
 *
 * Our records are not HGEM visits — they're first-party feedback events tied to a verified
 * redemption. The `source` field makes the distinction explicit for analysts.
 */

export type FeedbackSource = "foh-app";

export type FeedbackInput = {
  /** Token from the verification flow — binds feedback to a real, customer-confirmed visit. */
  verificationToken: string;
  /** 1-5 star rating. Required. */
  rating: number;
  /** 0-10 NPS. Optional. */
  npsScore?: number;
  /** Free text. Optional. */
  comment?: string;
};

export type FeedbackRecord = {
  /** Our internal id. */
  id: string;
  /** Mirrors HGEM `visitId` semantics — a unique handle for the visit-feedback row. */
  visitId: string;
  /** Mirrors HGEM `branchId` — the venue this feedback is about. */
  branchId: string;
  /** Human-readable venue name (denormalised, useful for warehouse views). */
  branchName: string;
  /** Opaque Airship/Toggle customer ref. Never PII. */
  customerRef: string;
  rating: number;
  npsScore?: number;
  comment?: string;
  /** ISO timestamp of submission. */
  submittedAt: string;
  /** Mirrors HGEM `modification_date` (Kleene's incremental key). Equals submittedAt for new rows. */
  modificationDate: string;
  source: FeedbackSource;
};
