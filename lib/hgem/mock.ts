import { randomUUID } from "crypto";
import type { HgemAdapter } from "./adapter";
import type { FeedbackRecord } from "./types";

const store: FeedbackRecord[] = [];

export const hgemMock: HgemAdapter = {
  async submitFeedback(input, context) {
    if (input.rating < 1 || input.rating > 5) {
      return { ok: false, reason: "rating_out_of_range" };
    }
    if (input.npsScore !== undefined && (input.npsScore < 0 || input.npsScore > 10)) {
      return { ok: false, reason: "nps_out_of_range" };
    }
    const now = new Date().toISOString();
    const record: FeedbackRecord = {
      id: randomUUID(),
      visitId: randomUUID(),
      branchId: slugify(context.branchName),
      branchName: context.branchName,
      customerRef: context.customerRef,
      rating: input.rating,
      npsScore: input.npsScore,
      comment: input.comment?.trim() || undefined,
      submittedAt: now,
      modificationDate: now,
      source: "foh-app",
    };
    store.push(record);
    if (process.env.NODE_ENV !== "production") {
      console.log("[hgem-mock] feedback submitted", {
        visitId: record.visitId,
        branchId: record.branchId,
        rating: record.rating,
        nps: record.npsScore,
      });
    }
    return { ok: true, record };
  },

  async recent(limit = 20) {
    return store.slice(-limit).reverse();
  },
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
