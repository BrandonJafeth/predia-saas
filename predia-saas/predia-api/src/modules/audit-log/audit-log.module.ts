import { Module } from '@nestjs/common';
import { SystemPrismaModule } from 'src/prisma/system-prisma.module';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditLogInterceptor } from 'src/common/interceptors/audit-log.interceptor';

@Module({
  imports: [SystemPrismaModule],
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditLogInterceptor],
  exports: [AuditLogService, AuditLogInterceptor],
})
export class AuditLogModule {}
