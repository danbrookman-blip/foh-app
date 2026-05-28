import { airshipMock } from "./mock";
import type { AirshipAdapter } from "./adapter";

/**
 * The active Airship adapter. Swap this export to the real client when wiring up
 * production Airship API credentials. The UI imports only from here.
 */
export const airship: AirshipAdapter = airshipMock;

export type { AirshipAdapter };
export * from "./types";
