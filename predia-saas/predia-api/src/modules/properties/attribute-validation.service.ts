import { BadRequestException, Injectable } from '@nestjs/common';
import Ajv, { ErrorObject, ValidateFunction } from 'ajv';

export interface AttributeValidationError {
  field: string;
  message: string;
}

@Injectable()
export class AttributeValidationService {
  private readonly ajv = new Ajv({ allErrors: true, strict: false });
  private readonly validatorCache = new Map<string, ValidateFunction>();

  /**
   * Valida `attributes` contra el JSON Schema (draft-07) de `attribute_schema`.
   * `cacheKey` (normalmente category.id) evita recompilar el mismo schema en
   * cada llamada; si el schema puede cambiar en runtime, pasa una key que
   * incluya su versión (ej. `${categoryId}:${updatedAt.getTime()}`).
   */
  validate(
    attributes: Record<string, unknown>,
    schema: Record<string, unknown>,
    cacheKey: string,
  ): void {
    const validateFn = this.getOrCompile(schema, cacheKey);
    const valid = validateFn(attributes);

    if (!valid) {
      throw new BadRequestException({
        message: 'attributes no cumple con el schema de la categoría',
        errors: this.formatErrors(validateFn.errors ?? []),
      });
    }
  }

  private getOrCompile(
    schema: Record<string, unknown>,
    cacheKey: string,
  ): ValidateFunction {
    const cached = this.validatorCache.get(cacheKey);
    if (cached) return cached;

    // additionalProperties: false fuerza modo estricto aunque el schema
    // guardado en la categoría no lo declare explícitamente.
    const compiled = this.ajv.compile({
      additionalProperties: false,
      ...schema,
    });
    this.validatorCache.set(cacheKey, compiled);
    return compiled;
  }

  private formatErrors(errors: ErrorObject[]): AttributeValidationError[] {
    return errors.map((err) => ({
      field: this.resolveFieldName(err),
      message: this.describeError(err),
    }));
  }

  private resolveFieldName(err: ErrorObject): string {
    if (err.keyword === 'required') {
      return String(err.params.missingProperty);
    }
    if (err.keyword === 'additionalProperties') {
      return String(err.params.additionalProperty);
    }
    const path = err.instancePath.replace(/^\//, '').replace(/\//g, '.');
    return path || '(raíz)';
  }

  private describeError(err: ErrorObject): string {
    switch (err.keyword) {
      case 'required':
        return `El campo "${err.params.missingProperty}" es requerido`;
      case 'type':
        return `Debe ser de tipo ${err.params.type as string}`;
      case 'enum':
        return `Debe ser uno de: ${(err.params.allowedValues as unknown[]).join(', ')}`;
      case 'additionalProperties':
        return `El campo "${err.params.additionalProperty}" no está definido en el schema de la categoría`;
      case 'minimum':
        return `Debe ser mayor o igual a ${err.params.limit as number}`;
      case 'maximum':
        return `Debe ser menor o igual a ${err.params.limit as number}`;
      case 'multipleOf':
        return `Debe ser múltiplo de ${err.params.multipleOf as number}`;
      case 'uniqueItems':
        return 'No puede tener elementos duplicados';
      default:
        return err.message ?? 'Valor inválido';
    }
  }
}
