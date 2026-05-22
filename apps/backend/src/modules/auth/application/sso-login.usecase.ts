import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InvitationStatus } from '@prisma/client';
import { Role } from '@sesur/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthTokenPair } from '../domain/auth-token.vo';
import type { MicrosoftProfile } from '../domain/microsoft-profile.vo';

/**
 * Use case — Connexion via Microsoft Entra ID avec Just-In-Time Provisioning.
 * Couche APPLICATION — orchestre le domaine, dépend d'abstractions injectées.
 */
@Injectable()
export class SsoLoginUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(profile: MicrosoftProfile): Promise<AuthTokenPair> {
    this.assertDomainAllowed(profile.email);
    const email = profile.email.toLowerCase();

    const user = await this.prisma.$transaction(async (tx) => {
      const byOid = await tx.user.findUnique({ where: { entraOid: profile.oid } });
      if (byOid) {
        return tx.user.update({
          where: { id: byOid.id },
          data: {
            email,
            displayName: profile.displayName,
            lastLoginAt: new Date(),
            ...(this.isSuperadminEmail(email) ? { role: Role.SUPER_ADMIN } : {}),
          },
        });
      }

      const byEmail = await tx.user.findUnique({ where: { email } });
      if (byEmail) {
        return tx.user.update({
          where: { id: byEmail.id },
          data: {
            entraOid: profile.oid,
            displayName: profile.displayName,
            lastLoginAt: new Date(),
            ...(this.isSuperadminEmail(email) ? { role: Role.SUPER_ADMIN } : {}),
          },
        });
      }

      if (this.isSuperadminEmail(email)) {
        return tx.user.create({
          data: {
            entraOid: profile.oid,
            email,
            displayName: profile.displayName,
            role: Role.SUPER_ADMIN,
            lastLoginAt: new Date(),
          },
        });
      }

      const invitation = await tx.invitation.findFirst({
        where: { email, status: InvitationStatus.PENDING },
        orderBy: { createdAt: 'desc' },
      });
      if (!invitation) {
        throw new ForbiddenException(
          'Aucune invitation pour cet email. Contactez un administrateur.',
        );
      }
      if (invitation.expiresAt < new Date()) {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED },
        });
        throw new ForbiddenException('Invitation expirée. Demandez à être relancé.');
      }

      const created = await tx.user.create({
        data: {
          entraOid: profile.oid,
          email,
          displayName: profile.displayName,
          role: invitation.role,
          lastLoginAt: new Date(),
        },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedById: created.id,
        },
      });
      return created;
    });

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }

    return this.issueTokens(user.id, user.email, user.role as Role, user.departmentId);
  }

  private assertDomainAllowed(email: string): void {
    const allowed = this.config.get<string[]>('entra.allowedDomains') ?? [];
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain || !allowed.includes(domain)) {
      throw new ForbiddenException(`Domaine email non autorisé: ${domain}`);
    }
  }

  private isSuperadminEmail(email: string): boolean {
    const list = this.config.get<string[]>('auth.superadminEmails') ?? [];
    return list.includes(email);
  }

  private async issueTokens(
    sub: string,
    email: string,
    role: Role,
    departmentId: string | null,
  ): Promise<AuthTokenPair> {
    const payload = { sub, email, role, departmentId };
    const accessTtl = this.config.get<string>('jwt.accessTtl') ?? '15m';
    const refreshTtl = this.config.get<string>('jwt.refreshTtl') ?? '7d';

    const accessToken = await this.jwt.signAsync(payload, { expiresIn: accessTtl });
    const refreshToken = await this.jwt.signAsync(
      { sub, typ: 'refresh' },
      { expiresIn: refreshTtl },
    );

    return new AuthTokenPair(accessToken, refreshToken, this.ttlToSeconds(accessTtl));
  }

  private ttlToSeconds(ttl: string): number {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 900;
    const [, value, unit] = match;
    const n = Number(value);
    switch (unit) {
      case 's': return n;
      case 'm': return n * 60;
      case 'h': return n * 3600;
      case 'd': return n * 86400;
      default: return 900;
    }
  }
}
