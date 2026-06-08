// src/common/decorators/audit-log.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMetadata {
  action: string;  // 'CREATE' | 'UPDATE' | 'DELETE' | 'SUSPEND' | etc.
  entity: string;  // 'property' | 'user' | 'tenant' | etc.
}

export const AuditLog = (metadata: AuditLogMetadata) =>
  SetMetadata(AUDIT_LOG_KEY, metadata);