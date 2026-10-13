# predia-website

Web pública de Predia (portal multi-inmobiliaria). Astro 6, salida estática, Tailwind 4.

## Datos

Todo se resuelve en el **build**: `src/lib/properties.ts` es la única costura con la fuente de datos.

- Con `PREDIA_API_URL` + `PREDIA_API_SECRET_KEY` lee la API pública de `predia-api` (`/public/v1`) con una key **secreta de portal**: propiedades publicadas de todas las inmobiliarias con suscripción vigente, categorías y ubicaciones.
- Sin ellas usa los datos de ejemplo de `src/data` (así compila en CI y en desarrollo sin API). El build lo avisa en consola.

Los tipos salen del OpenAPI del API (`@predia/api-types`): corré `pnpm generate:api` en la raíz del monorepo antes del primer build.

Rutas de detalle: `/propiedades/[agencia]/[slug]` (el slug es único dentro de cada inmobiliaria).

## API keys (cómo se manejan)

| Variable | Tipo de key | Dónde se usa |
| --- | --- | --- |
| `PREDIA_API_SECRET_KEY` | `sk_…` secreta, portal | Solo en el build (frontmatter). Variable `server`/`secret` de `astro:env`: importarla desde un `<script>` del navegador rompe el build. Nunca en el repo ni con prefijo `PUBLIC_`. |
| `PUBLIC_PREDIA_PUBLISHABLE_KEY` | `pk_…` publishable, portal | Formularios de contacto (navegador). Es pública por diseño: el API solo la acepta desde los orígenes registrados y solo permite leer lo publicado y crear leads (5 cada 10 min). |

El schema de `astro.config.mjs` exige `sk_` / `pk_` respectivamente: si alguien pone la key secreta en la variable pública, el build falla antes de publicarla. Las keys se crean en el CRM como super_admin → *API keys*. Ver `.env.example`.

## Seguridad y estándares

- **CSP** con hashes generada por Astro (`security.csp`) en cada página: sin `unsafe-inline`, `connect-src` limitado al sitio y al API. Por eso no hay `style=""` en el markup.
- `public/_headers` (Netlify / Cloudflare Pages): HSTS, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. En otro hosting hay que configurar lo mismo.
- **Accesibilidad (WCAG 2.2 AA)**: enlace para saltar al contenido, `lang="es-CR"`, galería en `<dialog>` nativo (foco atrapado, Esc), flechas del teclado solo dentro de la galería, formularios con `<label>`, `autocomplete`, errores en texto unidos con `aria-describedby`/`aria-invalid`, foco al primer error y resultado anunciado (`role="status"`/`"alert"`). Respeta `prefers-reduced-motion`.
- HTML validado con `html-validate` (presets `standard` + `a11y`) y páginas revisadas con axe-core.
- Formulario de leads: honeypot anti-spam y consentimiento explícito (Ley 8968).

## Comandos

```sh
pnpm dev       # localhost:4321 (la CSP no aplica en dev)
pnpm build     # dist/
pnpm preview   # sirve dist/ (acá sí aplica la CSP)
```
