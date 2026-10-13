import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { tenantStore } from '../common/als/tenant.store';

type TransactionFn = PrismaClient['$transaction'];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
    });
    super({ adapter });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const base = this;

    const extended = base.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            const ctx = tenantStore.getStore();
            // Dentro de un $transaction de este servicio el tenant ya quedó
            // fijado para toda la transacción: abrir otra acá la partiría en
            // dos y dejaría de ser atómica.
            if (!ctx?.tenantId || ctx.inTransaction) {
              return query(args);
            }
            const [, result] = await base.$transaction([
              base.$executeRaw`SELECT set_config('app.current_tenant_id', ${ctx.tenantId}, true)`,
              query(args),
            ]);
            return result;
          },
        },
      },
    });

    const originalTransaction = extended.$transaction.bind(
      extended,
    ) as TransactionFn;

    // $transaction tenant-aware: fija app.current_tenant_id UNA vez al inicio
    // de la transacción (batch o interactiva) y marca el contexto para que las
    // queries de adentro no se envuelvan en transacciones propias.
    const tenantAwareTransaction = ((arg: unknown, options?: unknown) => {
      const ctx = tenantStore.getStore();
      if (!ctx?.tenantId || ctx.inTransaction) {
        return originalTransaction(arg as never, options as never);
      }
      const txCtx = { ...ctx, inTransaction: true };
      const setTenant = () =>
        base.$executeRaw`SELECT set_config('app.current_tenant_id', ${ctx.tenantId}, true)`;

      if (typeof arg === 'function') {
        const fn = arg as (tx: unknown) => Promise<unknown>;
        return tenantStore.run(txCtx, () =>
          originalTransaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${ctx.tenantId}, true)`;
            return fn(tx);
          }, options as never),
        );
      }

      return tenantStore.run(txCtx, async () => {
        const results = await originalTransaction(
          [setTenant(), ...(arg as Prisma.PrismaPromise<unknown>[])],
          options as never,
        );
        return results.slice(1);
      });
    }) as TransactionFn;

    // $extends returns a new object; bind lifecycle hooks so NestJS can invoke them
    Object.assign(extended, {
      $transaction: tenantAwareTransaction,
      onModuleInit: (): Promise<void> => this.onModuleInit(),
      onModuleDestroy: (): Promise<void> => this.onModuleDestroy(),
    });

    return extended as this;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
