---
name: predia-backend
description: 'Convenciones y mejores prácticas del backend de Predia, un SaaS inmobiliario multi-tenant en NestJS + Prisma + PostgreSQL. Usá esta skill siempre que trabajes en el API de Predia (predia-api) para crear o modificar módulos, modelos de Prisma, endpoints, guards, DTOs, migraciones, seeds o cualquier código del backend, incluso si no se menciona la palabra convenciones. Aplicala también al revisar PRs del backend o al planear nuevas features del API.'
---

# Predia — Backend (NestJS + Prisma + PostgreSQL)

Predia es un SaaS **multi-tenant** para bienes raíces (y otros bienes como vehículos) en Costa Rica. El API alimenta tres consumidores: el CRM (usuarios de cada inmobiliaria, vía JWT), el portal central (público) y las webs white-label de los clientes (vía API key). El motor es **multivertical**: el mismo `properties` sirve para inmuebles, vehículos u otros bienes mediante categorías.

La regla que atraviesa todo: **el aislamiento entre tenants es sagrado**. Es el bug número uno en apps multi-tenant; cualquier descuido expone datos de una inmobiliaria a otra.

## Arquitectura

Organizá por **feature module**, cada uno autocontenido. Lo transversal va en `common/`.

```
src/
├── modules/            # un módulo por feature (controller, service, dto, module)
│   ├── auth/  tenants/  users/  properties/  categories/
│   ├── locations/  leads/  subscriptions/  payments/  public-api/
├── common/             # lo transversal
│   ├── guards/         # JwtGuard, TenantGuard, ApiKeyGuard
│   └── decorators/     # @CurrentTenant(), @CurrentUser()
├── config/             # buildSwaggerConfig(), etc.
└── prisma/             # PrismaModule (@Global) + PrismaService
```

Reglas de arquitectura:

- **El `AppModule` es solo ensamblador.** Importa `ConfigModule`, `PrismaModule` y los módulos de feature. Nunca metas ahí credenciales ni lógica de conexión.
- **`PrismaModule` es `@Global`** y exporta `PrismaService` (que extiende `PrismaClient` y conecta en `onModuleInit`). Los servicios inyectan `PrismaService` directamente, sin reimportar el módulo.
- **`ConfigModule.forRoot({ isGlobal: true })`** lee el `.env`. Las credenciales viven ahí, nunca hardcodeadas.
- Para generar un módulo nuevo, respetá la estructura de carpetas:
  ```bash
  nest g resource modules/<nombre> --no-spec
  ```
- Borrá el archivo `entities/*.entity.ts` que genera el CLI: usa decoradores de TypeORM y este proyecto usa **Prisma**. Usá los tipos que Prisma genera.

## Multi-tenancy (regla de oro)

- **Todo query de datos de tenant filtra por `tenant_id`.** Sin excepción.
- El aislamiento se respalda con **Row Level Security (RLS)** de PostgreSQL, no solo con el `where` de la aplicación.
- El `tenant_id` se obtiene del contexto del request (del JWT en el CRM, de la API key en el público), nunca del body que manda el cliente.
- **Mantené siempre dos tenants en el seed.** Cada vez que agregués una feature scopeada, probá el aislamiento cruzado: el tenant A no debe poder ver ni tocar datos del B.
- La única excepción es el **portal central**, que cruza tenants a propósito (solo propiedades con `is_published = true` de tenants activos). Esa consulta va por un endpoint/rol distinto al del CRM, nunca mezclada con la lógica scopeada.

## Base de datos y Prisma

- **PK siempre `id` de tipo `uuid`** (evita enumerar recursos entre tenants). Nunca `bigint` secuencial en tablas de tenant.
- **FK con patrón `<entidad>_id`**: `tenant_id`, `location_id`, `category_id`.
- **Sin prefijos redundantes en columnas**: `name`, no `location_name`. La tabla ya da el contexto.
- **`tenant_id` obligatorio** en toda tabla de datos de inquilino, con su política de RLS.
- **Índices** en las columnas por las que se filtra (`tenant_id`, `is_published`, `price`, ubicación, área) y **GIN** sobre las columnas JSONB.
- **Ubicaciones normalizadas**: `locations` es una tabla self-referencing (`parent_id`: cantón → provincia, distrito → cantón) con `code` (código INEC = código postal CR). Las propiedades guardan solo `location_id`.
- Migraciones: una por conjunto de tablas, coordinadas en equipo. Tras un cambio de schema, correr `pnpm prisma generate`.

## Catálogo multivertical (categories + attributes)

- Los campos **comunes y filtrables** (precio, moneda, área del lote, área construida, ubicación, operación) van como **columnas nativas** de `properties`, porque filtrarlos sobre columnas es rápido.
- Los campos **específicos de cada vertical** (kilometraje, transmisión, etc.) van en la columna `attributes` (JSONB).
- La tabla `categories` define cada vertical con un `attribute_schema` (JSONB) que describe los campos extra, su tipo y si son requeridos. Agregar un vertical es **insertar una fila**, no hacer una migración.
- Al crear/editar una propiedad, **validá `attributes` contra el `attribute_schema`** de su categoría (campos requeridos presentes, tipos correctos).

## Validación

- Toda entrada del API se valida con **DTOs + `class-validator`**. Nunca confíes en lo que manda el cliente.
- El `ValidationPipe` global va activo con `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`. El `whitelist` descarta props no declaradas (seguridad).

## Documentación (Swagger)

- Usá `@nestjs/swagger` **con el CLI plugin** activado en `nest-cli.json`. El plugin infiere la doc desde los DTOs y los decoradores de `class-validator`: no documentés campo por campo a mano.
- Lo único manual y opcional: `@ApiTags()` en los controllers para agrupar, y `@ApiOperation()` para descripciones puntuales.
- La config de Swagger vive en **un solo lugar** (`config/swagger.ts → buildSwaggerConfig()`), reutilizada por `main.ts` y por el script que exporta el OpenAPI. No la dupliques.
- La doc se sirve en `/docs` al iniciar la app; el spec en `/docs-json`.

## Convenciones del API

- Endpoints REST: `/api/v1/{módulo}/{recurso}`.
- Forma de respuesta consistente: `{ data, meta, error }`.
- Paginación **obligatoria** en endpoints de listas, sobre todo en el API público (anti-scraping).

## Seguridad

- **API keys hasheadas con SHA-256**, nunca en texto plano. Se guardan en la tabla `api_keys` (varias por tenant, revocables con `revoked_at`).
- El `ApiKeyGuard` valida: hash de la key + suscripción activa + dominio en `allowed_origins`.
- **Contraseñas con `bcrypt` o `argon2`**, nunca en texto plano.
- **Ningún secreto en el repo**: `.env` ignorado, solo se versiona `.env.example`.
- API pública con medidas anti-scraping: rate limiting, allowlist de dominios, paginación obligatoria, URLs firmadas para imágenes en alta. No expongas endpoints "dame todo".

## Facturación por SINPE (manual)

- SINPE **no tiene API ni webhooks**. La confirmación de pago es manual: el cliente paga → se registra un `payment` con su comprobante (`reference`) → se extiende `current_period_end`.
- El estado de la suscripción se refleja en `subscription_status` (`active` / `past_due` / `canceled`), cacheable.
- Un cron marca como `past_due` las suscripciones vencidas, y el `ApiKeyGuard` corta el acceso al feed público.
- No metas integración de Stripe ni webhooks en el MVP.

## Comandos

```bash
pnpm run dev                              # levanta el API en watch (consistente con front/website)
nest g resource modules/<nombre> --no-spec
pnpm prisma migrate dev --name <nombre>   # nueva migración
pnpm prisma generate                      # regenerar cliente tras cambiar el schema
pnpm prisma db seed                       # incluye 2 tenants, locations CR y categorías base
pnpm generate:api                         # exporta OpenAPI y regenera el cliente tipado
```

## Git

- Commits convencionales con scope: `feat(api): ...`, `fix(api): ...`, `chore(db): ...`.
- Ramas cortas `feat/api-...` o `fix/api-...`, con PR revisado por otro dev y squash merge.
- Si tocás datos de tenant, el PR debe incluir una verificación de aislamiento con dos tenants.