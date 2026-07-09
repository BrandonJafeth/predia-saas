import { BadRequestException } from '@nestjs/common';
import Ajv from 'ajv';
import {
  AttributeValidationError,
  AttributeValidationService,
} from './attribute-validation.service';

const SCHEMA = {
  type: 'object',
  required: ['tipo', 'area_m2'],
  properties: {
    tipo: { type: 'string', enum: ['casa', 'apartamento'] },
    area_m2: { type: 'number', minimum: 1 },
    habitaciones: { type: 'integer', minimum: 0, maximum: 50 },
    banos: { type: 'number', multipleOf: 0.5, minimum: 0 },
    amueblado: { type: 'boolean' },
    amenidades: {
      type: 'array',
      items: { type: 'string', enum: ['piscina', 'gimnasio'] },
      uniqueItems: true,
    },
  },
};

function getErrors(fn: () => void): AttributeValidationError[] {
  try {
    fn();
  } catch (error) {
    if (error instanceof BadRequestException) {
      const response = error.getResponse() as { errors: AttributeValidationError[] };
      return response.errors;
    }
    throw error;
  }
  throw new Error('Expected validate() to throw');
}

describe('AttributeValidationService', () => {
  let service: AttributeValidationService;

  beforeEach(() => {
    service = new AttributeValidationService();
  });

  it('acepta attributes válidos con todos los campos', () => {
    expect(() =>
      service.validate(
        {
          tipo: 'casa',
          area_m2: 120,
          habitaciones: 3,
          banos: 2.5,
          amueblado: true,
          amenidades: ['piscina'],
        },
        SCHEMA,
        'cat-1',
      ),
    ).not.toThrow();
  });

  it('acepta attributes con solo los campos required (opcionales ausentes)', () => {
    expect(() =>
      service.validate({ tipo: 'casa', area_m2: 80 }, SCHEMA, 'cat-1'),
    ).not.toThrow();
  });

  it('rechaza cuando falta un campo required (tipo)', () => {
    const errors = getErrors(() =>
      service.validate({ area_m2: 80 }, SCHEMA, 'cat-1'),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'tipo' }),
    );
  });

  it('rechaza cuando falta un campo required (area_m2)', () => {
    const errors = getErrors(() =>
      service.validate({ tipo: 'casa' }, SCHEMA, 'cat-1'),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'area_m2' }),
    );
  });

  it('rechaza tipo incorrecto (tipo como number en vez de string)', () => {
    const errors = getErrors(() =>
      service.validate({ tipo: 123, area_m2: 80 }, SCHEMA, 'cat-1'),
    );
    expect(errors[0].message).toMatch(/tipo de dato|string/i);
  });

  it('rechaza valor fuera del enum (tipo = "oficina")', () => {
    const errors = getErrors(() =>
      service.validate({ tipo: 'oficina', area_m2: 80 }, SCHEMA, 'cat-1'),
    );
    expect(errors[0].message).toMatch(/casa, apartamento/);
  });

  it('rechaza número bajo el mínimo (area_m2 = 0)', () => {
    const errors = getErrors(() =>
      service.validate({ tipo: 'casa', area_m2: 0 }, SCHEMA, 'cat-1'),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'area_m2' }),
    );
  });

  it('rechaza número sobre el máximo (habitaciones = 100)', () => {
    const errors = getErrors(() =>
      service.validate(
        { tipo: 'casa', area_m2: 80, habitaciones: 100 },
        SCHEMA,
        'cat-1',
      ),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'habitaciones' }),
    );
  });

  it('rechaza integer con decimales (habitaciones = 2.5)', () => {
    const errors = getErrors(() =>
      service.validate(
        { tipo: 'casa', area_m2: 80, habitaciones: 2.5 },
        SCHEMA,
        'cat-1',
      ),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'habitaciones' }),
    );
  });

  it('rechaza violación de multipleOf (banos = 1.3, step 0.5)', () => {
    const errors = getErrors(() =>
      service.validate({ tipo: 'casa', area_m2: 80, banos: 1.3 }, SCHEMA, 'cat-1'),
    );
    expect(errors[0].message).toMatch(/múltiplo/);
  });

  it('rechaza boolean inválido (amueblado = "si")', () => {
    const errors = getErrors(() =>
      service.validate(
        { tipo: 'casa', area_m2: 80, amueblado: 'si' },
        SCHEMA,
        'cat-1',
      ),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'amueblado' }),
    );
  });

  it('rechaza items duplicados en array (uniqueItems)', () => {
    const errors = getErrors(() =>
      service.validate(
        { tipo: 'casa', area_m2: 80, amenidades: ['piscina', 'piscina'] },
        SCHEMA,
        'cat-1',
      ),
    );
    expect(errors[0].message).toMatch(/duplicados/);
  });

  it('rechaza valor de enum inválido dentro de un array', () => {
    const errors = getErrors(() =>
      service.validate(
        { tipo: 'casa', area_m2: 80, amenidades: ['jacuzzi'] },
        SCHEMA,
        'cat-1',
      ),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rechaza atributos no definidos en el schema (modo estricto)', () => {
    const errors = getErrors(() =>
      service.validate(
        { tipo: 'casa', area_m2: 80, color_favorito: 'azul' },
        SCHEMA,
        'cat-1',
      ),
    );
    expect(errors).toContainEqual(
      expect.objectContaining({ field: 'color_favorito' }),
    );
  });

  it('acepta objeto vacío cuando el schema no tiene campos required', () => {
    const schemaSinRequired = { type: 'object', properties: { nota: { type: 'string' } } };
    expect(() => service.validate({}, schemaSinRequired, 'cat-2')).not.toThrow();
  });

  it('reporta múltiples errores en una sola llamada (allErrors)', () => {
    const errors = getErrors(() =>
      service.validate({ tipo: 123 }, SCHEMA, 'cat-1'),
    );
    // falta area_m2 (required) + tipo con tipo incorrecto
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it('reutiliza el validador compilado para el mismo cacheKey (no recompila)', () => {
    const compileSpy = jest.spyOn(Ajv.prototype, 'compile');

    service.validate({ tipo: 'casa', area_m2: 80 }, SCHEMA, 'cat-cache');
    const callsAfterFirst = compileSpy.mock.calls.length;

    service.validate({ tipo: 'apartamento', area_m2: 50 }, SCHEMA, 'cat-cache');
    expect(compileSpy.mock.calls.length).toBe(callsAfterFirst);

    compileSpy.mockRestore();
  });
});
