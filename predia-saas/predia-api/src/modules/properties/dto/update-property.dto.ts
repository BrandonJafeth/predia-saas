import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { PropertyStatus } from '@prisma/client';
import { CreatePropertyDto } from './create-property.dto';

// archived queda afuera a propósito: es el estado del soft-delete (ver
// PropertiesController#remove), no algo que se setee a mano desde el form de
// edición — findById/findBySlug/update ya excluyen archived, así que
// permitirlo acá dejaría la property inalcanzable apenas se guarda.
const EDITABLE_STATUSES = [
  PropertyStatus.draft,
  PropertyStatus.active,
  PropertyStatus.inactive,
  PropertyStatus.sold,
  PropertyStatus.rented,
] as const;

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
  @ApiPropertyOptional({
    enum: EDITABLE_STATUSES,
    description: 'Estado comercial de la propiedad (borrador, activa, inactiva, vendida, arrendada).',
  })
  @IsOptional()
  @IsIn(EDITABLE_STATUSES, { message: `status debe ser uno de: ${EDITABLE_STATUSES.join(', ')}` })
  status?: (typeof EDITABLE_STATUSES)[number];
}
