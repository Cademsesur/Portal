import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Role } from '@sesur/shared';
import { MailsService } from '../../mails/mails.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PURCHASE_REQUEST_DECIDED,
  PURCHASE_REQUEST_SUBMITTED,
  type PurchaseRequestDecidedEvent,
  type PurchaseRequestSubmittedEvent,
} from '../../purchase-requests/domain/events';
import {
  renderDecidedEmail,
  renderSubmittedEmail,
} from '../infrastructure/purchase-request-emails.template';

@Injectable()
export class PurchaseRequestMailerListener {
  private readonly logger = new Logger(PurchaseRequestMailerListener.name);

  constructor(
    private readonly mails: MailsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent(PURCHASE_REQUEST_SUBMITTED, { async: true })
  async onSubmitted(event: PurchaseRequestSubmittedEvent): Promise<void> {
    const recipients = await this.prisma.user.findMany({
      where: {
        role: Role.DAF,
        isActive: true,
      },
      select: { email: true },
    });

    if (recipients.length === 0) {
      this.logger.warn(
        `Aucun DAF actif pour notifier la soumission de ${event.reference}`,
      );
      return;
    }

    const requestUrl = `${this.frontendUrl()}/requests/${event.requestId}`;
    const { html, text } = renderSubmittedEmail({
      reference: event.reference,
      requesterName: event.requesterName,
      department: event.department,
      description: event.description,
      requestUrl,
    });

    await Promise.all(
      recipients.map((r) =>
        this.mails
          .send({
            to: r.email,
            subject: `Demande ${event.reference} à valider`,
            html,
            text,
          })
          .catch((err) =>
            this.logger.error(
              `Échec notification soumission à ${r.email}: ${(err as Error).message}`,
            ),
          ),
      ),
    );
  }

  @OnEvent(PURCHASE_REQUEST_DECIDED, { async: true })
  async onDecided(event: PurchaseRequestDecidedEvent): Promise<void> {
    const requestUrl = `${this.frontendUrl()}/requests/${event.requestId}`;
    const { html, text } = renderDecidedEmail({
      reference: event.reference,
      decision: event.decision,
      comment: event.comment,
      approverName: event.approverName,
      requestUrl,
    });
    const verb = event.decision === 'APPROVED' ? 'approuvée' : 'rejetée';

    try {
      await this.mails.send({
        to: event.requesterEmail,
        subject: `Votre demande ${event.reference} ${verb}`,
        html,
        text,
      });
    } catch (err) {
      this.logger.error(
        `Échec notification décision à ${event.requesterEmail}: ${(err as Error).message}`,
      );
    }
  }

  private frontendUrl(): string {
    return this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
  }
}
