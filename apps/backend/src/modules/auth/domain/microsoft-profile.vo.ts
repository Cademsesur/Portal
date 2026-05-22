/**
 * Profil Microsoft normalisé après vérification du id_token Entra ID.
 * Couche DOMAIN.
 */
export interface MicrosoftProfile {
  oid: string;
  tenantId: string;
  email: string;
  displayName: string;
}
