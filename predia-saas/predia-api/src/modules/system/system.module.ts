import { Module } from '@nestjs/common';
import { SystemPrismaModule } from 'src/prisma/system-prisma.module';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';

@Module({
  imports: [SystemPrismaModule],
  controllers: [SystemController],
  providers: [SystemService],
})
export class SystemModule {}
