import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { tenantStore } from '../common/als/tenant.store';

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
            const tenantId = tenantStore.getStore()?.tenantId;
            if (tenantId) {
              const [, result] = await base.$transaction([
                base.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`,
                query(args),
              ]);
              return result;
            }
            return query(args);
          },
        },
      },
    });

    // $extends returns a new object; bind lifecycle hooks so NestJS can invoke them
    Object.assign(extended, {
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
