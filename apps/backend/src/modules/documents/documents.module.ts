import { Module } from '@nestjs/common';
import { PurchaseRequestsModule } from '../purchase-requests/purchase-requests.module';
import { RequestDocumentService } from './application/request-document.service';
import { RequestSignatureService } from './application/request-signature.service';
import { DocumentsController } from './interfaces/documents.controller';

/**
 * Module DOCUMENTS — génère la « Fiche de demande d'achat » pré-remplie
 * en PDF (LibreOffice) et Word (docxtemplater), à partir du gabarit officiel,
 * signatures du demandeur et de l'approbateur apposées.
 */
@Module({
  imports: [PurchaseRequestsModule],
  controllers: [DocumentsController],
  providers: [RequestDocumentService, RequestSignatureService],
  exports: [RequestDocumentService, RequestSignatureService],
})
export class DocumentsModule {}
