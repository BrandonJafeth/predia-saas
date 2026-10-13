/**
 * Normaliza un origen para compararlo exactamente con el header Origin
 * (RFC 6454 / Fetch): esquema + host + puerto, sin path, query ni fragmento.
 * Solo https — http únicamente para localhost (desarrollo). Sin comodines:
 * un "*.dominio.com" permitiría que cualquier subdominio comprometido use la key.
 * Devuelve null si el valor no es un origen válido.
 */
export function normalizeOrigin(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(
    url.hostname,
  );
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalhost)) {
    return null;
  }
  if (url.username || url.password || url.search || url.hash) return null;
  if (url.pathname !== '/' && url.pathname !== '') return null;
  if (url.hostname.includes('*')) return null;
  return url.origin;
}
