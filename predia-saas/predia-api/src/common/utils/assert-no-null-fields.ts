import { BadRequestException } from '@nestjs/common';

/**
 * En los DTO de PATCH (`PartialType`), `@IsOptional()` deja pasar `null` sin
 * correr ningún otro validador. En columnas NOT NULL eso llegaba a Prisma y
 * terminaba en un 500; esto lo convierte en un 400 con mensaje claro.
 *
 * Usarlo solo con los campos NO nulables: en los nulables `null` significa
 * "limpiar el valor" y es válido.
 */
export function assertNoNullFields<T extends object>(
  dto: T,
  fields: readonly (keyof T)[],
): void {
  const nullFields = fields.filter((field) => dto[field] === null);
  if (nullFields.length > 0) {
    throw new BadRequestException(
      nullFields.map((field) => `${String(field)} no puede ser null`),
    );
  }
}
