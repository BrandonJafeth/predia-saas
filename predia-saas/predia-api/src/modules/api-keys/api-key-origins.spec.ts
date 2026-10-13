import { normalizeOrigin } from './api-key-origins';

describe('normalizeOrigin', () => {
  it.each([
    ['https://www.Agencia.com', 'https://www.agencia.com'],
    ['https://agencia.com/', 'https://agencia.com'],
    ['https://agencia.com:443', 'https://agencia.com'],
    ['https://agencia.com:8443', 'https://agencia.com:8443'],
    ['http://localhost:4321', 'http://localhost:4321'],
    ['  https://agencia.com  ', 'https://agencia.com'],
  ])('acepta %s → %s', (input, expected) => {
    expect(normalizeOrigin(input)).toBe(expected);
  });

  it.each([
    'http://agencia.com', // http fuera de localhost
    'https://*.agencia.com', // comodín
    'https://agencia.com/ruta',
    'https://agencia.com?x=1',
    'https://agencia.com#frag',
    'https://user:pass@agencia.com',
    'javascript:alert(1)',
    'agencia.com',
    '*',
  ])('rechaza %s', (input) => {
    expect(normalizeOrigin(input)).toBeNull();
  });
});
