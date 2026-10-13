import { Module } from '@nestjs/common';
import { SystemPrismaModule } from 'src/prisma/system-prisma.module';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { LocationsModule } from '../locations/locations.module';
import { PublicApiController } from './public-api.controller';
import { PublicCatalogService } from './public-catalog.service';
import { PublicLeadsService } from './public-leads.service';
import { PublicPropertiesService } from './public-properties.service';

@Module({
  imports: [ApiKeysModule, SystemPrismaModule, AuditLogModule, LocationsModule],
  controllers: [PublicApiController],
  providers: [
    ApiKeyGuard,
    PublicPropertiesService,
    PublicCatalogService,
    PublicLeadsService,
  ],
})
export class PublicApiModule {}
