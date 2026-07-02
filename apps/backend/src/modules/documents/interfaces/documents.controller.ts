import {
  ConflictException,
  Controller,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { GetPurchaseRequestUseCase } from '../../purchase-requests/application/get-purchase-request.usecase';
import {
  RequestDocumentService,
  type DocumentFormat,
} from '../application/request-document.service';
import { RequestSignatureService } from '../application/request-signature.service';

@ApiTags('documents')
@Controller('purchase-requests')
export class DocumentsController {
  constructor(
    private readonly getRequest: GetPurchaseRequestUseCase,
    private readonly documents: RequestDocumentService,
    private readonly signatures: RequestSignatureService,
  ) {}

  /**
   * Statut d'exportabilité : décision rendue + présence des deux signatures.
   * Permet à l'UI d'afficher/masquer les boutons et d'indiquer ce qui manque.
   */
  @Get(':id/document/availability')
  async availability(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const detail = await this.getRequest.execute(id, user.id, user.role);
    const decided =
      detail.status === 'APPROVED' || detail.status === 'REJECTED';
    return this.signatures.status(id, decided);
  }

  /**
   * Télécharge la fiche de demande pré-remplie (PDF ou Word).
   * Réservé au demandeur et à la DAF (contrôle d'accès délégué au use case),
   * après décision ET une fois les deux signatures (demandeur + approbateur)
   * enregistrées.
   */
  @Get(':id/document')
  async download(
    @Param('id') id: string,
    @Query('format') format: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ): Promise<void> {
    const fmt: DocumentFormat = format === 'docx' ? 'docx' : 'pdf';
    const detail = await this.getRequest.execute(id, user.id, user.role);

    const decided =
      detail.status === 'APPROVED' || detail.status === 'REJECTED';
    if (!decided) {
      throw new ConflictException(
        "Le document n'est disponible qu'une fois la demande décidée.",
      );
    }

    const status = await this.signatures.status(id, decided);
    if (!status.canExport) {
      const manquantes = [
        status.requesterSigned ? null : 'du demandeur',
        status.approverSigned ? null : "de l'approbateur (DAF)",
      ].filter(Boolean);
      throw new ConflictException(
        `Export impossible : signature ${manquantes.join(' et ')} manquante. ` +
          'Chaque partie doit enregistrer sa signature depuis son profil.',
      );
    }

    const signatures = await this.signatures.resolve(id);
    const buffer = await this.documents.build(detail, fmt, signatures);
    const filename = this.documents.filename(detail.reference, fmt);

    res.setHeader('Content-Type', this.documents.mimeType(fmt));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  }
}
