import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LeadActivityType } from '@prisma/client';
import { CreateLeadActivityDto } from './create-lead-activity.dto';

const validBase = {
  type: LeadActivityType.note,
  description: 'El prospecto pidió una visita.',
};

async function validateDto(plain: object) {
  const dto = plainToInstance(CreateLeadActivityDto, plain);
  return validate(dto);
}

describe('CreateLeadActivityDto', () => {
  it('acepta payload válido', async () => {
    const errors = await validateDto(validBase);
    expect(errors).toHaveLength(0);
  });

  it('requiere type', async () => {
    const rest: Partial<typeof validBase> = { ...validBase };
    delete rest.type;
    const errors = await validateDto(rest);
    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });

  it('rechaza type inválido listando valores permitidos', async () => {
    const errors = await validateDto({ ...validBase, type: 'sms' });
    const typeError = errors.find((e) => e.property === 'type');

    expect(typeError?.constraints?.isEnum).toContain('call');
    expect(typeError?.constraints?.isEnum).toContain('email');
    expect(typeError?.constraints?.isEnum).toContain('status_change');
  });

  it('requiere description', async () => {
    const rest: Partial<typeof validBase> = { ...validBase };
    delete rest.description;
    const errors = await validateDto(rest);
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });

  it('rechaza description vacío', async () => {
    const errors = await validateDto({ ...validBase, description: '' });
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });

  it('elimina espacios en blanco de description', () => {
    const dto = plainToInstance(CreateLeadActivityDto, {
      ...validBase,
      description: '  Nota de seguimiento  ',
    });

    expect(dto.description).toBe('Nota de seguimiento');
  });
});
