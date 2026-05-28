import { toggleMock } from "./mock";
import type { ToggleAdapter } from "./adapter";

/**
 * Active Toggle adapter. Swap to a real Toggle client by replacing this export.
 */
export const toggle: ToggleAdapter = toggleMock;

export type { ToggleAdapter };
export * from "./types";
