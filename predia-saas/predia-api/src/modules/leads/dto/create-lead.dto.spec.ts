import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LeadSource, LeadStatus } from '@prisma/client';
import { CreateLeadDto } from './create-lead.dto';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const validBase = {
  name: 'María Fernández',
  email: 'maria.fernandez@example.com',
  phone: '+50688887777',
  source: LeadSource.web,
  status: LeadStatus.new,
  assigned_to: VALID_UUID,
  property_id: VALID_UUID,
  notes: 'Busca casa en condominio.',
};

async function validateDto(plain: object) {
  const dto = plainToInstance(CreateLeadDto, plain);
  return validate(dto);
}

describe('CreateLeadDto', () => {
  it('acepta payload válido', async () => {
    const errors = await validateDto(validBase);
    expect(errors).toHaveLength(0);
  });

  it('rechaza payload sin name', async () => {
    const rest: Partial<typeof validBase> = { ...validBase };
    delete rest.name;
    const errors = await validateDto(rest);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rechaza email inválido con mensaje claro', async () => {
    const errors = await validateDto({
      ...validBase,
      email: 'correo-invalido',
    });
    const emailError = errors.find((e) => e.property === 'email');

    expect(emailError?.constraints).toEqual(
      expect.objectContaining({
        isEmail: 'email debe ser un correo válido',
      }),
    );
  });

  it('rechaza source inválido listando valores permitidos', async () => {
    const errors = await validateDto({ ...validBase, source: 'billboard' });
    const sourceError = errors.find((e) => e.property === 'source');

    expect(sourceError?.constraints?.isEnum).toContain('web');
    expect(sourceError?.constraints?.isEnum).toContain('referral');
    expect(sourceError?.constraints?.isEnum).toContain('other');
  });

  it('rechaza status inválido listando valores permitidos', async () => {
    const errors = await validateDto({ ...validBase, status: 'closed' });
    const statusError = errors.find((e) => e.property === 'status');

    expect(statusError?.constraints?.isEnum).toContain('new');
    expect(statusError?.constraints?.isEnum).toContain('won');
    expect(statusError?.constraints?.isEnum).toContain('lost');
  });

  it('rechaza assigned_to con formato UUID inválido', async () => {
    const errors = await validateDto({ ...validBase, assigned_to: 'bad-uuid' });
    expect(errors.some((e) => e.property === 'assigned_to')).toBe(true);
  });

  it('rechaza property_id con formato UUID inválido', async () => {
    const errors = await validateDto({ ...validBase, property_id: 'bad-uuid' });
    expect(errors.some((e) => e.property === 'property_id')).toBe(true);
  });

  it('permite assigned_to y property_id opcionales', async () => {
    const rest: Partial<typeof validBase> = { ...validBase };
    delete rest.assigned_to;
    delete rest.property_id;
    const errors = await validateDto(rest);
    expect(errors).toHaveLength(0);
  });

  it('elimina espacios y normaliza email a minúsculas', () => {
    const dto = plainToInstance(CreateLeadDto, {
      ...validBase,
      name: '  María Fernández  ',
      email: '  MARIA.FERNANDEZ@EXAMPLE.COM  ',
      notes: '  Nota interna  ',
    });

    expect(dto.name).toBe('María Fernández');
    expect(dto.email).toBe('maria.fernandez@example.com');
    expect(dto.notes).toBe('Nota interna');
  });
});
