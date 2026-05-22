import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RevokeInvitationUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { id } });
    if (!invitation) throw new NotFoundException('Invitation introuvable');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Impossible de révoquer une invitation au statut ${invitation.status}`,
      );
    }
    return this.prisma.invitation.update({
      where: { id },
      data: { status: InvitationStatus.REVOKED, revokedAt: new Date() },
    });
  }
}
