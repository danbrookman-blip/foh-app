import { hgemMock } from "./mock";
import type { HgemAdapter } from "./adapter";

/**
 * Active HGEM adapter. Swap to a real client (HGEM partner write endpoint, or your
 * data warehouse) by replacing this export. UI imports only from here.
 */
export const hgem: HgemAdapter = hgemMock;

export type { HgemAdapter };
export * from "./types";
