import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderImageItem {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  id!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  position!: number;
}

export class ReorderImagesDto {
  @ApiProperty({ type: [ReorderImageItem] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReorderImageItem)
  @ArrayUnique((o: ReorderImageItem) => o.id, { message: 'No se permiten IDs duplicados' })
  @ArrayUnique((o: ReorderImageItem) => o.position, { message: 'No se permiten posiciones duplicadas' })
  items!: ReorderImageItem[];
}
