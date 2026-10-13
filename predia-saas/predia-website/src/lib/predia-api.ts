// Cliente de predia-api para el BUILD (frontmatter de Astro). Usa la key
// secreta del portal (sk_), que vive solo en el entorno del build: astro:env
// impide importarla desde código del navegador, y el API rechaza una sk_ si la
// request trae cabecera Origin (o sea, si sale de un navegador).
import { PREDIA_API_SECRET_KEY, PREDIA_API_URL } from 'astro:env/server';

const TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 4;
const MAX_RETRY_WAIT_MS = 65_000;

export const isApiConfigured = Boolean(PREDIA_API_URL && PREDIA_API_SECRET_KEY);

export class PrediaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'PrediaApiError';
  }
}

type Query = Record<string, string | number | undefined>;

function buildUrl(path: string, query?: Query): URL {
  const url = new URL(path, PREDIA_API_URL);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url;
}

// El throttler del API responde Retry-After-<nombre> (p. ej. Retry-After-public).
function retryAfterMs(res: Response, attempt: number): number {
  for (const [name, value] of res.headers) {
    if (name.startsWith('retry-after')) {
      const seconds = Number(value);
      if (Number.isFinite(seconds)) return Math.min(seconds * 1000 + 250, MAX_RETRY_WAIT_MS);
    }
  }
  return Math.min(1000 * 2 ** attempt, MAX_RETRY_WAIT_MS);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GET a /public/v1. Reintenta 429 (respetando Retry-After) y 5xx con backoff.
 * 404 → null. Cualquier otro error corta el build: es preferible no publicar
 * a publicar el sitio vacío o a medias.
 */
export async function apiGet<T>(path: string, query?: Query): Promise<T | null> {
  if (!isApiConfigured) throw new PrediaApiError('predia-api no está configurado', 0);
  const url = buildUrl(path, query);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'X-API-Key': PREDIA_API_SECRET_KEY as string, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      if (attempt === MAX_ATTEMPTS - 1) throw err;
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (res.ok) return (await res.json()) as T;
    if (res.status === 404) return null;
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS - 1) {
      await sleep(retryAfterMs(res, attempt));
      continue;
    }
    // Nunca loguear la key: solo método, ruta y estado.
    throw new PrediaApiError(`GET ${url.pathname} respondió ${res.status}`, res.status);
  }
  throw new PrediaApiError(`GET ${url.pathname}: sin respuesta tras ${MAX_ATTEMPTS} intentos`, 0);
}

/** map() con concurrencia limitada: no disparar cientos de requests a la vez. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
