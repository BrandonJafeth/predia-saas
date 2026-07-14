// Shape mirrors predia-api/src/scripts/seed-locations.ts (province -> canton -> district,
// codes = PCCDD per INEC). Codes below are illustrative, not the exact INEC digits —
// once predia-api runs its real seed against ubicaciones.paginasweb.cr, swap this file
// for a fetch and drop it; the Property.location shape does not change.
import type { PropertyLocation } from '../lib/types/property';

export const locations: PropertyLocation[] = [
  { id: 'loc_sj', name: 'San José', code: '10000', type: 'province', parent_id: null },
  { id: 'loc_sj_escazu', name: 'Escazú', code: '10100', type: 'canton', parent_id: 'loc_sj' },
  { id: 'loc_sj_santa_ana', name: 'Santa Ana', code: '10200', type: 'canton', parent_id: 'loc_sj' },
  { id: 'loc_heredia', name: 'Heredia', code: '40000', type: 'province', parent_id: null },
  { id: 'loc_heredia_san_rafael', name: 'San Rafael', code: '40300', type: 'canton', parent_id: 'loc_heredia' },
  { id: 'loc_guanacaste', name: 'Guanacaste', code: '50000', type: 'province', parent_id: null },
  { id: 'loc_guanacaste_santa_cruz', name: 'Santa Cruz', code: '50500', type: 'canton', parent_id: 'loc_guanacaste' },
  { id: 'loc_guanacaste_tamarindo', name: 'Tamarindo', code: '50501', type: 'district', parent_id: 'loc_guanacaste_santa_cruz' },
];

export function getLocationById(id: string): PropertyLocation | undefined {
  return locations.find((l) => l.id === id);
}
