import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { SystemPrismaModule } from './prisma/system-prisma.module';
import { HealthModule } from './health/health.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SystemModule } from './modules/system/system.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { EmailModule } from './modules/email/email.module';
import { TenantSitesModule } from './modules/tenant-sites/tenant-sites.module';
import { LocationsModule } from './modules/locations/locations.module';
import { CategoriesModule } from './modules/categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        SYSTEM_DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
        RESEND_API_KEY: Joi.string().default(''),
        EMAIL_FROM: Joi.string().email().default('noreply@predia.com'),
        EMAIL_FROM_NAME: Joi.string().default('Predia'),
        EMAIL_ENABLED: Joi.string().valid('true', 'false').default('true'),
        APP_URL: Joi.string().default('http://localhost:5173'),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 300,
      },
      {
        // Global fallback alto — no throttlea rutas normales.
        // Los endpoints sensibles (forgot-password, reset-password) usan
        // @Throttle({ 'auth-strict': { limit: 3 } }) que overridea esto.
        name: 'auth-strict',
        ttl: 60_000,
        limit: 1000,
      },
    ]),
    PrismaModule,
    SystemPrismaModule,
    HealthModule,
    EmailModule,
    AuthModule,
    SystemModule,
    TenantsModule,
    UsersModule,
    AuditLogModule,
    TenantSitesModule,
    LocationsModule,
    CategoriesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
