import { PartialType } from '@nestjs/swagger';
import { CreateTenantSiteDto } from './create-tenant-site.dto';

export class UpdateTenantSiteDto extends PartialType(CreateTenantSiteDto) {}
