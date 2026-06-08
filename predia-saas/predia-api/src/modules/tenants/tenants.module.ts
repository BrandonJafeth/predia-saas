import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { SystemPrismaModule } from 'src/prisma/system-prisma.module';

@Module({
  imports: [SystemPrismaModule],
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
