// Single place for brand/contact facts still pending (Prompt Maestro A6).
// Every TODO here is a real gap, not a stylistic choice — fill in and every
// page (footer, JSON-LD, WhatsApp CTAs) picks it up automatically.
export const site = {
  name: 'Predia',
  domain: 'https://predia.cr', // ASUMIDO — confirmar dominio real
  tagline: 'Bienes de alto valor en Costa Rica',
  description:
    'Predia es el portal costarricense para encontrar y publicar propiedades y vehículos de alto valor, con contacto directo al agente responsable de cada propiedad.',
  locale: 'es-CR',
  contact: {
    email: null as string | null, // TODO: ej. hola@predia.cr
    phone: null as string | null, // TODO
    whatsapp: null as string | null, // TODO: 506XXXXXXXX (sin +, sin espacios)
    city: null as string | null, // TODO: ej. San José, Costa Rica
    country: 'Costa Rica',
  },
  social: {
    instagram: null as string | null,
    facebook: null as string | null,
  },
} as const;

export function whatsappLink(message?: string): string | null {
  if (!site.contact.whatsapp) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${site.contact.whatsapp}${text}`;
}
