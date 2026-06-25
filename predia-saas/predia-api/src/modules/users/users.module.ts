import { Module } from '@nestjs/common';
import { SystemPrismaModule } from '../../prisma/system-prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SystemPrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
