import { Module } from '@nestjs/common';
import { SystemPrismaModule } from 'src/prisma/system-prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [SystemPrismaModule, AuditLogModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
