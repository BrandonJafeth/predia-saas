// Contrato de la API pública (predia-api/src/modules/public-api/dto). Los tipos
// salen del OpenAPI generado (@predia/api-types, `pnpm generate:api`): si el API
// cambia un campo, el build de la web falla en vez de romperse en producción.
// Es lo mismo que recibe cualquier web white-label: nada de ids internos,
// emails de agentes ni estados de publicación (OWASP API3).
import type { components } from '@predia/api-types';

type Schemas = components['schemas'];

export type PropertySummary = Schemas['PublicPropertyDto'];
export type PropertyDetail = Schemas['PublicPropertyDetailDto'];
export type PropertyImage = Schemas['PublicImageDto'];
export type PropertyLocation = Schemas['PublicLocationDto'];
export type PropertyAmenity = Schemas['PublicAmenityDto'];
export type Category = Schemas['PublicCategoryDto'];
export type LocationNode = Schemas['PublicLocationNodeDto'];
export type CreateLeadPayload = Schemas['CreatePublicLeadDto'];

export type OperationType = PropertySummary['operation_type'];
export type CurrencyCode = PropertySummary['currency'];
export type LocationType = PropertyLocation['type'];

/** Lo que tienen en común el listado y el detalle (tarjetas, precio). */
export type PropertyLike = PropertySummary | PropertyDetail;
export type PropertyPage = Schemas['PageOfPublicPropertyDto'];
