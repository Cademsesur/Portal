import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ListInvitationsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: { select: { id: true, email: true, displayName: true } },
      },
    });
  }
}
