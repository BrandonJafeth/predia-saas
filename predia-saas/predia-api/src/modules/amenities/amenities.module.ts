import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AmenitiesController } from './amenities.controller';
import { AmenitiesService } from './amenities.service';
import { CategoryAmenitiesController } from './category-amenities.controller';
import { PropertyAmenitiesController } from './property-amenities.controller';

@Module({
  imports: [AuditLogModule],
  controllers: [
    AmenitiesController,
    CategoryAmenitiesController,
    PropertyAmenitiesController,
  ],
  providers: [AmenitiesService],
  exports: [AmenitiesService],
})
export class AmenitiesModule {}