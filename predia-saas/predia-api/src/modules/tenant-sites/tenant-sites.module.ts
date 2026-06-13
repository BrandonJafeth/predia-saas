import { Module } from '@nestjs/common';
import { TenantSitesController } from './tenant-sites.controller';
import { TenantSitesService } from './tenant-sites.service';

@Module({
  controllers: [TenantSitesController],
  providers: [TenantSitesService],
  exports: [TenantSitesService],
})
export class TenantSitesModule {}
