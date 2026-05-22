import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailsService } from '../../mails/mails.service';
import { renderInvitationEmail } from '../infrastructure/invitation-email.template';

@Injectable()
export class ResendInvitationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mails: MailsService,
    private readonly config: ConfigService,
  ) {}

  async execute(id: string) {
    const invitation = await this.prisma.invitation.findUnique({ where: { id } });
    if (!invitation) throw new NotFoundException('Invitation introuvable');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Impossible de relancer une invitation au statut ${invitation.status}`,
      );
    }

    const frontendUrl = this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/login?invitation=${invitation.token}`;
    const { html, text } = renderInvitationEmail({ inviteUrl });
    await this.mails.send({
      to: invitation.email,
      subject: 'Rappel — Vous êtes invité sur Portal SESUR',
      html,
      text,
    });

    return this.prisma.invitation.update({
      where: { id },
      data: {
        lastSentAt: new Date(),
        resendCount: { increment: 1 },
      },
    });
  }
}
