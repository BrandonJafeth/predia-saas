import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';

// Los advisor_* solo sirven para crear el admin inicial junto al tenant; no
// son columnas de Tenant. Antes se pasaban tal cual a Prisma → 500.
export class UpdateTenantDto extends PartialType(
  OmitType(CreateTenantDto, [
    'advisor_email',
    'advisor_password',
    'advisor_first_name',
    'advisor_last_name',
  ] as const),
) {}
