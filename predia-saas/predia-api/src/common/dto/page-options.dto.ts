import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PageOptionsDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  readonly limit?: number = 10;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 10);
  }
}
