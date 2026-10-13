import { ApiProperty } from '@nestjs/swagger';

export class PropertyStatsResponseDto {
  @ApiProperty({ description: 'Total de propiedades no archivadas del tenant' })
  total!: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Conteo por status (draft, active, inactive, sold, rented)',
    example: { draft: 3, active: 12 },
  })
  by_status!: Record<string, number>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Conteo por operation_type (sale, rent, lease)',
    example: { sale: 10, rent: 5 },
  })
  by_operation_type!: Record<string, number>;
}
