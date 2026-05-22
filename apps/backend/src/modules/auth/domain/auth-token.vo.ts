/**
 * Value Object représentant une paire de tokens d'authentification.
 * Couche DOMAIN — pure, aucune dépendance framework.
 */
export class AuthTokenPair {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly expiresInSec: number,
  ) {}
}
