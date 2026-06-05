# Predia

**Plataforma SaaS multi-tenant para la gestión y publicación de bienes raíces** (y otros bienes como vehículos) enfocada en el mercado costarricense.

Predia combina un **CRM por suscripción**, un **portal central** donde se publican las propiedades de todas las inmobiliarias, y la posibilidad de alimentar la **web propia (white-label)** de cada cliente con esos mismos datos a través de una API.

---

## Tabla de contenidos

- [Qué es Predia](#qué-es-predia)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del monorepo](#estructura-del-monorepo)
- [Conceptos clave](#conceptos-clave)
- [Requisitos previos](#requisitos-previos)
- [Instalación y desarrollo local](#instalación-y-desarrollo-local)
- [Variables de entorno](#variables-de-entorno)
- [Convenciones y buenas prácticas](#convenciones-y-buenas-prácticas)
- [Roadmap de desarrollo](#roadmap-de-desarrollo)
- [Autor](#autor)

---

## Qué es Predia

Predia resuelve tres necesidades en un solo producto:

1. **CRM (por suscripción):** cada inmobiliaria gestiona sus propiedades, leads y seguimiento de clientes.
2. **Portal central:** las propiedades marcadas como publicadas aparecen en un portal compartido que concentra tráfico y genera leads.
3. **Web white-label:** el cliente puede tener su propio sitio, con su marca y dominio, que consume las mismas propiedades vía API.

El modelo es **multivertical dentro del nicho de "bienes"**: nace para bienes raíces, pero el mismo motor sirve para vehículos u otros bienes de alto valor, sin rehacer la base de datos.

---

## Arquitectura

```mermaid
flowchart LR
    subgraph Clientes
        CRM[CRM - React + Vite]
        WEB[Web white-label - Astro]
        PORTAL[Portal central - Astro/Next]
    end

    API[API - NestJS]
    DB[(PostgreSQL)]
    REDIS[(Redis - cache / rate-limit)]

    CRM -->|JWT| API
    WEB -->|API key| API
    PORTAL -->|público| API
    API --> DB
    API --> REDIS
```

- El **CRM** se autentica con JWT (usuarios de cada tenant).
- La **web white-label** consume la API mediante una **API key** por tenant; sin suscripción activa, se le corta el acceso a los datos.
- El **portal central** lee las propiedades publicadas de todos los tenants (consulta especial que cruza inquilinos).

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| API | NestJS (TypeScript) |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Cache / rate-limit / colas | Redis + BullMQ *(fase posterior)* |
| CRM (admin) | React + Vite |
| Web pública / white-label | Astro |
| Estilos | Tailwind CSS + design system propio |
| Pagos | SINPE Móvil *(confirmación manual)* |
| Gestor de paquetes | pnpm (workspaces) |

---

## Estructura del monorepo

```
predia-saas/
├── predia-api/            # API en NestJS (módulos por feature)
├── predia-front/          # CRM en React + Vite (carpetas por feature)
├── predia-website/        # Web pública / white-label en Astro
├── pnpm-workspace.yaml
└── README.md
```

### Módulos del API (NestJS)

```
predia-api/src/
├── modules/
│   ├── auth/
│   ├── tenants/
│   ├── users/
│   ├── properties/
│   ├── categories/
│   ├── locations/
│   ├── leads/
│   ├── subscriptions/
│   ├── payments/
│   └── public-api/        # feed con API key + captura pública de leads
├── common/                # guards, interceptors, decorators, filters
│   ├── guards/            # JwtGuard, TenantGuard, ApiKeyGuard
│   └── decorators/        # @CurrentTenant(), @CurrentUser()
├── config/
└── prisma/
```

---

## Conceptos clave

### Multi-tenancy (shared schema + RLS)
Todas las inmobiliarias comparten las mismas tablas, distinguidas por una columna `tenant_id`. El aislamiento entre tenants se garantiza con **Row Level Security (RLS)** de PostgreSQL: una inmobiliaria nunca puede ver los datos de otra, aunque estén físicamente en la misma tabla.

### Catálogo multivertical (categories + attributes)
La tabla `categories` define cada vertical (bienes raíces, vehículos) mediante un `attribute_schema` en JSONB. Cada propiedad guarda sus campos específicos en una columna `attributes` (JSONB), mientras que los campos comunes y filtrables (precio, área, ubicación) viven como columnas nativas. Agregar un vertical nuevo es insertar una fila, no una migración.

### API keys por tenant
Cada tenant tiene una o varias API keys (almacenadas **hasheadas**, nunca en texto plano) que autorizan a su web white-label a leer sus datos. El acceso se valida en un `ApiKeyGuard` que también revisa el estado de la suscripción y el dominio de origen.

### Facturación por SINPE (manual)
SINPE no tiene API ni webhooks, así que la confirmación de pago es manual: el cliente paga, se registra un `payment` con su comprobante y se extiende el `current_period_end` de la suscripción. Un cron marca como `past_due` las suscripciones vencidas y el `ApiKeyGuard` corta el acceso.

### Modelo de datos
El esquema completo (16 tablas) está documentado en [`docs/schema.dbml`](docs/schema.dbml). Dominios principales: tenancy y accesos, facturación, web white-label, ubicaciones (catálogo oficial de CR), catálogo multivertical, propiedades y CRM.

---

## Requisitos previos

- Node.js 20+
- pnpm 9+
- Docker (para PostgreSQL y Redis en local)
- Git

---

## Instalación y desarrollo local

```bash
# 1. Clonar el repo
git clone https://github.com/BrandonJafeth/predia-saas.git
cd predia-saas

# 2. Instalar dependencias (todo el monorepo)
pnpm install

# 3. Levantar PostgreSQL en Docker
docker compose up -d

# 4. Configurar variables de entorno
cp predia-api/.env.example predia-api/.env

# 5. Migrar y sembrar la base de datos
cd predia-api
pnpm prisma migrate dev
pnpm prisma db seed   # incluye ubicaciones de CR y categorías base

# 6. Levantar las apps
pnpm dev:api          # API en NestJS
pnpm dev:front        # CRM en React + Vite
pnpm dev:website      # Web en Astro
```

---

## Variables de entorno

Cada app tiene su propio archivo `.env`. **Nunca** se suben al repo; se versiona solo un `.env.example` como referencia.

Ejemplo para `predia-api`:

```env
DATABASE_URL="postgresql://predia:predia@localhost:5432/predia?schema=public"
JWT_SECRET="cambiar-en-produccion"
JWT_EXPIRES_IN="7d"
PORT=3000
```

---

## Convenciones y buenas prácticas

### Base de datos
- **Llaves primarias:** siempre `id` de tipo `uuid` (evita enumeración de recursos entre tenants).
- **Llaves foráneas:** patrón `<entidad>_id` (ej. `tenant_id`, `location_id`).
- **Sin prefijos redundantes:** `name`, no `location_name`. La tabla ya da el contexto.
- **`tenant_id` obligatorio** en toda tabla de datos de inquilino, con su política de RLS.
- **Índices** en las columnas por las que se filtra (`tenant_id`, `is_published`, `price`, ubicación) y **GIN** sobre las columnas JSONB.

### Arquitectura de carpetas
- **NestJS:** un módulo por feature, autocontenido (`controller`, `service`, `dto`, `module`). Lo transversal va en `common/`.
- **React:** carpetas por feature; cada feature contiene sus componentes, hooks, tipos y llamadas al API. Solo lo reutilizable sube a `components/` y `lib/`.

### Multi-tenancy (regla de oro)
- Todo endpoint de datos de tenant debe scoparse por `tenant_id`.
- **Mantener siempre dos tenants en el seed** y probar el aislamiento cruzado cada vez que se agrega una feature. Es el bug número uno en apps multi-tenant.

### Seguridad
- API keys siempre **hasheadas** (SHA-256), nunca en texto plano.
- Las contraseñas con `bcrypt`/`argon2`.
- Ningún secreto en el repositorio (`.env` ignorado, `.env.example` versionado).
- Medidas anti-scraping en la API pública: rate limiting, allowlist de dominios, paginación obligatoria y URLs firmadas para imágenes en alta.

### Git
- **Commits convencionales:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- **Ramas:** `main` estable; trabajo en ramas `feat/...` o `fix/...` con PR.
- Un solo `.gitignore` en la raíz con patrones sin barra inicial (para que apliquen a las tres apps).

### Código
- TypeScript en modo estricto en las tres apps.
- ESLint + Prettier; formatear antes de commitear.
- DTOs con `class-validator` para validar toda entrada del API.
- El frontend reutiliza el **design system** (Poppins/Martel, paleta verde/gris/blanco, tokens WCAG AA/AAA).

---

## Roadmap de desarrollo

El desarrollo sigue un orden por dependencias, dejando las integraciones externas para el final:

- [ ] **Fase 0** — Setup: NestJS + Prisma + Docker (PostgreSQL).
- [ ] **Fase 1** — Tenancy + Auth (JWT, contexto de tenant, RLS).
- [ ] **Fase 2** — Datos de referencia: `locations` (seed CR) y `categories`.
- [ ] **Fase 3** — Propiedades (CRUD, imágenes, validación de `attributes`).
- [ ] **Fase 4** — CRM (leads + actividades).
- [ ] **Fase 5** — API pública + API keys (portal y web white-label).
- [ ] **Fase 6** — Facturación SINPE (pagos manuales + cron de vencimiento).
- [ ] **Fase 7** — Optimización: Redis (cache, rate-limit) y BullMQ.

---

## Autor

**Brandon Carrillo** — One Out Solutions
Desarrollo full-stack · Costa Rica
