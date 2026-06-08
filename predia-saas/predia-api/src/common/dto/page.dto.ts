import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';
import { PageMetaDto } from './page-meta.dto';

export class PageDto<T> {
  readonly data: T[];

  @ApiProperty({ type: () => PageMetaDto })
  readonly meta: PageMetaDto;

  constructor(data: T[], meta: PageMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}

/**
 * Factory para crear una clase concreta de PageDto<T> que Swagger pueda
 * introspeccionar. Swagger no resuelve genéricos, necesita una clase real.
 *
 * Uso en el controller:
 *   @ApiOkResponse({ type: PageOf(UserResponseDto) })
 */
export function PageOf<T>(ItemDto: Type<T>) {
  class PageOfDto extends PageDto<T> {
    @ApiProperty({ type: () => ItemDto, isArray: true })
    declare readonly data: T[];
  }
  Object.defineProperty(PageOfDto, 'name', { value: `PageOf${ItemDto.name}` });
  return PageOfDto;
}
