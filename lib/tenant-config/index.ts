import { tenantConfigMock } from "./mock";
import type { TenantConfigAdapter } from "./adapter";

/**
 * Active tenant-config adapter. Production replaces with the operator-config
 * service that brand admins write to.
 */
export const tenantConfig: TenantConfigAdapter = tenantConfigMock;

export type { TenantConfigAdapter };
export * from "./types";
