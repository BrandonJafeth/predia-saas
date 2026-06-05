# Guía de contribución — Predia

Esta guía define cómo trabajamos en el repositorio. **Todos los integrantes del equipo deben seguir estas reglas** para mantener el historial limpio, evitar conflictos y poder revisar el código de los demás sin fricción.

---

## Flujo de trabajo (GitHub Flow)

Usamos un flujo simple y suficiente para un equipo pequeño:

- La rama `main` está **siempre estable y desplegable**.
- **Nunca se trabaja ni se hace push directo a `main`.**
- Todo cambio se hace en una **rama corta** que nace de `main` y vuelve a `main` mediante un **Pull Request (PR)**.

```
main                    # siempre funcional
 ├── feat/api-jwt-auth   # rama corta, una por tarea
 ├── feat/front-leads
 └── fix/api-rls-leads
```

---

## Ramas

### Protección de `main`
La rama `main` está protegida en GitHub:
- Requiere **Pull Request** para fusionar (no se permite push directo).
- Requiere al menos **1 aprobación** de otro desarrollador antes del merge.

### Nomenclatura
Las ramas siguen el patrón `tipo/scope-descripción-corta`, donde el *scope* indica a qué app afecta:

| Scope | Área |
|-------|------|
| `api` | Backend (NestJS) |
| `front` | CRM (React + Vite) |
| `website` | Web pública (Astro) |
| `db` | Esquema / migraciones / seeds |

Ejemplos:

```
feat/api-jwt-auth
feat/front-leads-table
fix/api-rls-leads
chore/website-deps
docs/readme
```

Mantené las ramas **cortas**: entre menos tiempo viva una rama, menos conflictos al fusionar.

---

## Commits (Conventional Commits)

Formato:

```
tipo(scope): descripción en imperativo
```

### Tipos permitidos
- `feat` — nueva funcionalidad
- `fix` — corrección de un bug
- `chore` — mantenimiento (dependencias, config)
- `docs` — documentación
- `refactor` — cambio interno sin alterar comportamiento
- `test` — pruebas
- `perf` — mejoras de rendimiento
- `style` — formato (sin cambios de lógica)

### Reglas
- En **minúscula** y en **imperativo** (`agregar`, no `agregué` ni `agregado`).
- Sin punto final.
- La primera línea, corta (bajo ~72 caracteres).
- El *por qué* del cambio va en el cuerpo del commit, no en el título.

### Ejemplos

```
feat(api): agregar guard de api key
fix(api): corregir filtro RLS en la tabla leads
feat(front): tabla de propiedades con paginación
chore(db): agregar índice GIN sobre attributes
docs: actualizar README con instrucciones de seed
```

---

## Pull Requests

- **PR pequeños y frecuentes** > un PR gigante al final. Más fáciles de revisar y con menos conflictos.
- Cada PR debe ser **revisado por otro desarrollador** (no se auto-fusiona).
- Se fusiona con **Squash and merge**: toda la rama se vuelve un solo commit limpio en `main`.
- **Borrá la rama** después de fusionar.

### Antes de abrir un PR, revisá:
- [ ] La rama está actualizada con `main` (`git pull --rebase origin main`).
- [ ] El código pasa el linter y está formateado (ESLint + Prettier).
- [ ] No hay secretos ni `.env` en los cambios.
- [ ] Si tocaste datos de tenant, probaste el aislamiento con dos tenants.
- [ ] La descripción del PR explica **qué** cambia y **por qué**.

---

## Coordinación del equipo

Somos 3 desarrolladores sobre el mismo monorepo, así que coordinamos para no chocar:

- **Definimos el contrato del API primero** (endpoints + DTOs/tipos). Con eso claro, el `front` y la `website` avanzan en paralelo sin esperar al backend.
- **Compartimos los tipos de TypeScript** en un paquete común del monorepo, para que el contrato sea uno solo y no se desincronice.
- Cada quien hace `git pull --rebase` de `main` seguido, para no alejarse del resto.
- Avisamos en el canal del equipo en qué módulo estamos trabajando, para no editar los mismos archivos a la vez.

---

## Ciclo de trabajo (paso a paso)

```bash
# 1. Partí siempre de un main actualizado
git checkout main
git pull

# 2. Creá tu rama
git checkout -b feat/api-jwt-auth

# 3. Trabajá con commits pequeños y frecuentes
git add .
git commit -m "feat(api): agregar guard de api key"

# 4. Subí la rama
git push -u origin feat/api-jwt-auth

# 5. Abrí el PR en GitHub, pedí revisión, fusioná (squash) y borrá la rama
```

---

## Automatización de las convenciones (commitlint + husky)

Para que los commits cumplan el formato de forma automática (y no dependa de la memoria de nadie), el repo usa **commitlint + husky**. Configuración inicial (una sola vez, en la raíz del monorepo):

```bash
pnpm add -D -w husky @commitlint/cli @commitlint/config-conventional
pnpm exec husky init
```

Creá el archivo `commitlint.config.js` en la raíz:

```js
export default {
  extends: ['@commitlint/config-conventional'],
};
```

Y el hook `.husky/commit-msg` con este contenido:

```sh
pnpm exec commitlint --edit $1
```

A partir de ahí, cualquier commit que no siga el formato `tipo(scope): descripción` será rechazado antes de crearse.

---

## CODEOWNERS (opcional)

Para asignar revisor automático según el área tocada, se puede crear `.github/CODEOWNERS`:

```
# Backend
/predia-api/        @usuario-backend

# CRM
/predia-saas/predia-front/    @usuario-frontend

# Web pública
/predia-saas/predia-website/  @usuario-web
```

Reemplazá los `@usuario-*` por los handles reales de GitHub del equipo.