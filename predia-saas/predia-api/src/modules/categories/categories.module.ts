import { Module } from '@nestjs/common';
import { SystemPrismaModule } from '../../prisma/system-prisma.module';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [SystemPrismaModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
