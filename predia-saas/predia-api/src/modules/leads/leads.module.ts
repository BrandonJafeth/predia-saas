import { Module } from '@nestjs/common';
import { LeadVisibilityGuard } from './guards/lead-visibility.guard';
import { LeadVisibilityService } from './lead-visibility.service';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, LeadVisibilityService, LeadVisibilityGuard],
  exports: [LeadsService, LeadVisibilityService, LeadVisibilityGuard],
})
export class LeadsModule {}
