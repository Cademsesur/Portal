export type SsoProvider = 'microsoft' | 'google';

export interface SsoProfile {
  provider: SsoProvider;
  providerId: string;
  email: string;
  displayName: string;
}
