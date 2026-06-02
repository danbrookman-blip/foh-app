import { kindnessMock } from "./mock";
import type { KindnessAdapter } from "./adapter";

/** Active Kindness adapter. Swap to a real client by replacing this export. */
export const kindness: KindnessAdapter = kindnessMock;

export type { KindnessAdapter };
export * from "./types";
export { CATALOG, findAward } from "./catalog";
