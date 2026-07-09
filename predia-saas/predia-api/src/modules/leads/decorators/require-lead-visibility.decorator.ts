import { SetMetadata } from '@nestjs/common';

export const LEAD_VISIBILITY_KEY = 'lead_visibility';

export interface LeadVisibilityOptions {
  leadIdParam: string;
}

export const RequireLeadVisibility = (leadIdParam: string) =>
  SetMetadata(LEAD_VISIBILITY_KEY, { leadIdParam });
