import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { DocType } from '@prisma/client';
import { Role } from '@sesur/shared';
import { RequestDocumentService } from '../../documents/application/request-document.service';
import { RequestSignatureService } from '../../documents/application/request-signature.service';
import { StorageService } from '../../files/storage.service';
import { MailsService, type MailAttachment } from '../../mails/mails.service';
import { PrismaService } from '../../prisma/prisma.service';
import { toPurchaseRequestDetail } from '../../purchase-requests/application/purchase-request.mapper';
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
    private readonly documents: RequestDocumentService,
    private readonly signatures: RequestSignatureService,
    private readonly storage: StorageService,
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

    const attachments = await this.buildPdfAttachment(event.requestId, event.reference);

    try {
      await this.mails.send({
        to: event.requesterEmail,
        subject: `Votre demande ${event.reference} ${verb}`,
        html,
        text,
        attachments,
      });
    } catch (err) {
      this.logger.error(
        `Échec notification décision à ${event.requesterEmail}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Génère le PDF pré-rempli, l'archive dans le stockage objet (best-effort)
   * et le renvoie comme pièce jointe. Un échec de génération ne bloque pas
   * l'envoi de l'email de décision.
   */
  private async buildPdfAttachment(
    requestId: string,
    reference: string,
  ): Promise<MailAttachment[]> {
    try {
      // Le document n'est joint que si les deux signatures sont enregistrées.
      const status = await this.signatures.status(requestId, true);
      if (!status.canExport) {
        this.logger.log(
          `PDF de ${reference} non joint : signatures incomplètes ` +
            `(demandeur=${status.requesterSigned}, approbateur=${status.approverSigned}).`,
        );
        return [];
      }

      const request = await this.prisma.purchaseRequest.findUnique({
        where: { id: requestId },
        include: {
          items: { orderBy: { position: 'asc' } },
          approvals: { orderBy: { createdAt: 'desc' } },
        },
      });
      if (!request) return [];

      const detail = toPurchaseRequestDetail(request);
      const signatures = await this.signatures.resolve(requestId);
      const pdf = await this.documents.build(detail, 'pdf', signatures);
      const filename = this.documents.filename(reference, 'pdf');

      // Archivage best-effort dans MinIO + traçabilité en base.
      const storageKey = `purchase-requests/${requestId}/${filename}`;
      try {
        await this.storage.putObject(storageKey, pdf, this.documents.mimeType('pdf'));
        if (this.storage.isReady()) {
          await this.prisma.generatedDocument.create({
            data: { requestId, type: DocType.PDF, storageKey },
          });
        }
      } catch (err) {
        this.logger.warn(
          `Archivage du document ${reference} ignoré: ${(err as Error).message}`,
        );
      }

      return [{ filename, content: pdf, contentType: this.documents.mimeType('pdf') }];
    } catch (err) {
      this.logger.error(
        `Génération du PDF pour ${reference} échouée: ${(err as Error).message}`,
      );
      return [];
    }
  }

  private frontendUrl(): string {
    return this.config.get<string>('frontendUrl') ?? 'http://localhost:3000';
  }
}
