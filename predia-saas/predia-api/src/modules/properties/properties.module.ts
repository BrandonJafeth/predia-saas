import { Module } from '@nestjs/common';
import { AttributeValidationService } from './attribute-validation.service';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, AttributeValidationService],
  exports: [PropertiesService, AttributeValidationService],
})
export class PropertiesModule {}
