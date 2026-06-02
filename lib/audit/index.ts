import { auditMock } from "./mock";
import type { AuditAdapter } from "./adapter";

/**
 * Active audit adapter. Production swaps to an immutable store (S3 Object Lock,
 * AWS QLDB, or a managed audit service) by replacing this export.
 */
export const audit: AuditAdapter = auditMock;

export { hashIdentifier, hashIdentifierShort } from "./hashing";
export type { AuditAdapter };
export * from "./types";
