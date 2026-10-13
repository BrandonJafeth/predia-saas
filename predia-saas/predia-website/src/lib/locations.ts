// Árbol de ubicaciones (provincia → cantón → distrito) que entrega el API.
import type { LocationNode, LocationType } from './types/property';

export interface LocationRow {
  id: string;
  name: string;
  type: LocationType;
  parent_id: string | null;
}

export interface LocationChain {
  provinceId: string | null;
  cantonId: string | null;
  districtId: string | null;
}

export function flattenTree(tree: LocationNode[], parentId: string | null = null): LocationRow[] {
  return tree.flatMap((node) => [
    { id: node.id, name: node.name, type: node.type, parent_id: parentId },
    ...flattenTree(node.children, node.id),
  ]);
}

// Una propiedad puede estar cargada a nivel de provincia, cantón o distrito:
// se sube por los padres y se anota cada nivel para el filtro en cascada.
export function resolveChain(byId: Map<string, LocationRow>, locationId: string | null): LocationChain {
  const chain: LocationChain = { provinceId: null, cantonId: null, districtId: null };
  let current = locationId ? byId.get(locationId) : undefined;
  while (current) {
    if (current.type === 'district') chain.districtId = current.id;
    else if (current.type === 'canton') chain.cantonId = current.id;
    else chain.provinceId = current.id;
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return chain;
}

/** Solo las ubicaciones con alguna propiedad (o ancestro de una): sin opciones vacías. */
export function usedLocations(rows: LocationRow[], locationIds: (string | null)[]): LocationRow[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const used = new Set<string>();
  for (const id of locationIds) {
    let current = id ? byId.get(id) : undefined;
    while (current && !used.has(current.id)) {
      used.add(current.id);
      current = current.parent_id ? byId.get(current.parent_id) : undefined;
    }
  }
  return rows.filter((r) => used.has(r.id));
}
