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

// Properties are tagged at province, canton, OR district level depending on how
// precisely the agency filled it in — walk the parent_id chain and bucket each
// ancestor by type so a cascading provincia/cantón/distrito filter has real IDs
// to compare against, whichever level the property actually specifies.
export interface LocationChain {
  provinceId: string | null;
  cantonId: string | null;
  districtId: string | null;
}

export function resolveLocationChain(locationId: string | null): LocationChain {
  const chain: LocationChain = { provinceId: null, cantonId: null, districtId: null };
  let current = locationId ? getLocationById(locationId) : undefined;
  while (current) {
    if (current.type === 'district') chain.districtId = current.id;
    else if (current.type === 'canton') chain.cantonId = current.id;
    else if (current.type === 'province') chain.provinceId = current.id;
    current = current.parent_id ? getLocationById(current.parent_id) : undefined;
  }
  return chain;
}

export function getProvinceFor(locationId: string | null): PropertyLocation | null {
  const { provinceId } = resolveLocationChain(locationId);
  return provinceId ? (getLocationById(provinceId) ?? null) : null;
}
