import { Injectable } from '@nestjs/common';
import type { PurchaseRequestDetail } from '../../purchase-requests/application/purchase-request.mapper';
import { toRequestDocumentData } from '../domain/request-document.model';
import {
  renderRequestDocx,
  type RequestSignatures,
} from '../infrastructure/docx-renderer';
import { renderRequestPdf } from '../infrastructure/pdf-renderer';

export type DocumentFormat = 'pdf' | 'docx';

const MIME: Record<DocumentFormat, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

@Injectable()
export class RequestDocumentService {
  /**
   * Génère la fiche pré-remplie. Le DOCX est produit à partir du gabarit
   * officiel (docxtemplater) ; le PDF en est la conversion LibreOffice.
   * Les signatures du demandeur/approbateur sont apposées si fournies.
   */
  async build(
    detail: PurchaseRequestDetail,
    format: DocumentFormat,
    signatures: RequestSignatures = {},
  ): Promise<Buffer> {
    const data = toRequestDocumentData(detail);
    const docx = renderRequestDocx(data, signatures);
    return format === 'docx' ? docx : renderRequestPdf(docx);
  }

  mimeType(format: DocumentFormat): string {
    return MIME[format];
  }

  filename(reference: string, format: DocumentFormat): string {
    const safe = reference.replace(/[^A-Za-z0-9._-]+/g, '-');
    return `Demande_${safe}.${format}`;
  }
}
