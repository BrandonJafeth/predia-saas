import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePropertyDto } from './create-property.dto';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const validBase = {
  title: 'Casa en Santa Ana',
  price: 250000,
  operation_type: 'sale',
  category_id: VALID_UUID,
};

async function validateDto(plain: object) {
  const dto = plainToInstance(CreatePropertyDto, plain);
  return validate(dto);
}

describe('CreatePropertyDto', () => {
  it('acepta payload mínimo válido sin location_id', async () => {
    const errors = await validateDto(validBase);
    expect(errors).toHaveLength(0);
  });

  it('rechaza payload sin title', async () => {
    const { title: _, ...rest } = validBase;
    const errors = await validateDto(rest);
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('rechaza title con menos de 3 caracteres', async () => {
    const errors = await validateDto({ ...validBase, title: 'AB' });
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('rechaza price igual a cero', async () => {
    const errors = await validateDto({ ...validBase, price: 0 });
    expect(errors.some((e) => e.property === 'price')).toBe(true);
  });

  it('rechaza price negativo', async () => {
    const errors = await validateDto({ ...validBase, price: -100 });
    expect(errors.some((e) => e.property === 'price')).toBe(true);
  });

  it('rechaza operation_type inválido', async () => {
    const errors = await validateDto({ ...validBase, operation_type: 'buy' });
    expect(errors.some((e) => e.property === 'operation_type')).toBe(true);
  });

  it('rechaza category_id con formato UUID inválido', async () => {
    const errors = await validateDto({ ...validBase, category_id: 'not-a-uuid' });
    expect(errors.some((e) => e.property === 'category_id')).toBe(true);
  });

  it('rechaza location_id con formato UUID inválido cuando se envía', async () => {
    const errors = await validateDto({ ...validBase, location_id: 'bad-uuid' });
    expect(errors.some((e) => e.property === 'location_id')).toBe(true);
  });

  it('acepta payload con location_id UUID válido', async () => {
    const errors = await validateDto({ ...validBase, location_id: VALID_UUID });
    expect(errors).toHaveLength(0);
  });

  it('rechaza lat sin lng', async () => {
    const errors = await validateDto({ ...validBase, lat: 9.9281 });
    expect(errors.some((e) => e.property === 'lng')).toBe(true);
  });

  it('rechaza lng sin lat', async () => {
    const errors = await validateDto({ ...validBase, lng: -84.0907 });
    expect(errors.some((e) => e.property === 'lat')).toBe(true);
  });

  it('acepta par lat/lng válido', async () => {
    const errors = await validateDto({ ...validBase, lat: 9.9281, lng: -84.0907 });
    expect(errors).toHaveLength(0);
  });

  it('rechaza lat fuera de rango', async () => {
    const errors = await validateDto({ ...validBase, lat: 91, lng: -84 });
    expect(errors.some((e) => e.property === 'lat')).toBe(true);
  });

  it('elimina espacios en blanco del title', () => {
    const dto = plainToInstance(CreatePropertyDto, { ...validBase, title: '  Casa bonita  ' });
    expect(dto.title).toBe('Casa bonita');
  });

  it('rechaza lot_area_m2 negativo', async () => {
    const errors = await validateDto({ ...validBase, lot_area_m2: -50 });
    expect(errors.some((e) => e.property === 'lot_area_m2')).toBe(true);
  });
});
