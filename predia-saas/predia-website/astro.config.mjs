// @ts-check
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";

// El origen del API entra en connect-src de la CSP: el navegador solo puede
// hablar con este sitio y con predia-api (formularios de contacto).
const { PUBLIC_PREDIA_API_URL } = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");
const apiOrigin = PUBLIC_PREDIA_API_URL ? new URL(PUBLIC_PREDIA_API_URL).origin : null;

// https://astro.build/config
export default defineConfig({
  site: "https://predia.cr",
  env: {
    // astro:env separa lo que puede llegar al navegador (context: "client")
    // de lo que solo existe en el build/servidor. Importar una variable
    // "server" desde un <script> del cliente rompe el build: la key secreta
    // no puede filtrarse al bundle por accidente.
    schema: {
      PREDIA_API_URL: envField.string({ context: "server", access: "public", optional: true, url: true }),
      PREDIA_API_SECRET_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        startsWith: "sk_",
      }),
      PUBLIC_PREDIA_API_URL: envField.string({ context: "client", access: "public", optional: true, url: true }),
      PUBLIC_PREDIA_PUBLISHABLE_KEY: envField.string({
        context: "client",
        access: "public",
        optional: true,
        // Una sk_ acá terminaría en el JS público: el build falla antes.
        startsWith: "pk_",
      }),
    },
    validateSecrets: true,
  },
  security: {
    // Hashes para cada script/estilo que emite Astro + allowlist explícita.
    // Las cabeceras que no pueden ir en <meta> (frame-ancestors, HSTS…) están
    // en public/_headers.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com",
        "font-src https://fonts.gstatic.com",
        `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}`,
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
      ],
      styleDirective: { resources: ["'self'", "https://fonts.googleapis.com"] },
      scriptDirective: { resources: ["'self'"] },
    },
  },
  // Sin Markdown en el sitio; Shiki usa estilos inline incompatibles con la CSP.
  markdown: { syntaxHighlight: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
