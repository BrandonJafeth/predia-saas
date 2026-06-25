import { Module } from '@nestjs/common';
import { SystemPrismaModule } from '../../prisma/system-prisma.module';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  imports: [SystemPrismaModule],
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
