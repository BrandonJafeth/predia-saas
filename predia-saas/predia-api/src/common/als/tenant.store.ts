import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  // true mientras corre un $transaction de PrismaService que ya fijó
  // app.current_tenant_id para toda la transacción: las queries de adentro
  // no deben abrir su propia transacción (rompería la atomicidad).
  inTransaction?: boolean;
}

export const tenantStore = new AsyncLocalStorage<TenantContext>();
