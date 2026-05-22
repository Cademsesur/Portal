import { Module } from '@nestjs/common';

/**
 * Module AUDIT_LOGS — journalisation immuable (append-only) de toutes les actions sensibles.
 * Interceptor global + listeners domain events.
 */
@Module({})
export class AuditLogsModule {}
