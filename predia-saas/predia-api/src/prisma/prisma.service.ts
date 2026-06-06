import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { tenantAls } from '../common/als/tenant.als';

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

    const client = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            const tenantId = tenantAls.getStore()?.tenantId;
            if (tenantId) {
              const [, result] = await client.$transaction([
                client.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`,
                query(args),
              ]);
              return result;
            }
            return query(args);
          },
        },
      },
    });

    Object.assign(client, {
      onModuleInit: this.onModuleInit.bind(this),
      onModuleDestroy: this.onModuleDestroy.bind(this),
    });

    return client as unknown as this;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
