import { Transform } from 'class-transformer';

/**
 * trim + minúsculas antes de validar. Los emails se guardan y comparan
 * normalizados: antes "Juan@x.com" y "juan@x.com" eran cuentas distintas y el
 * login fallaba si el usuario escribía una mayúscula.
 */
export const NormalizeEmail = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
