import createClient from 'openapi-fetch';
import type { paths } from './schema';

// Ejecutar `pnpm generate:api` antes de importar este paquete
export const createApiClient = (baseUrl: string) =>
  createClient<paths>({ baseUrl });

export type { paths, components };
