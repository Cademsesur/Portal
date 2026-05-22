import { randomBytes } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailsService } from '../../mails/mails.service';
import type { CreateInvitationDto } from '../dto/create-invitation.dto';
import { renderInvitationEmail } from '../infrastructure/invitation-email.template';

const INVITATION_TTL_DAYS = 7;

@Injectable()
export class CreateInvitationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mails: MailsService,
    private readonly config: ConfigService,
  ) {}

  async execute(dto: CreateInvitationDto, invitedById: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException(`L'utilisateur ${dto.email} existe déjà`);
    }

    const existingPending = await this.prisma.invitation.findFirst({
      where: { email: dto.email, status: InvitationStatus.PENDING },
    });
    if (existingPending) {
      throw new BadRequestException(
        `Une invitation est déjà en cours pour ${dto.email}`,
      );
    }

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 3600 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: dto.email,
        role: dto.role,
        token,
        invitedById,
        expiresAt,
      },
    });

    try {
      await this.sendEmail(invitation.email, invitation.token);
    } catch (err) {
      await this.prisma.invitation.delete({ where: { id: invitation.id } }).catch(() => undefined);
      throw err;
    }
    return invitation;
  }

  private async sendEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/login?invitation=${token}`;
    const { html, text } = renderInvitationEmail({ inviteUrl });
    await this.mails.send({
      to: email,
      subject: "Vous êtes invité sur Portal — SESUR",
      html,
      text,
    });
  }
}
