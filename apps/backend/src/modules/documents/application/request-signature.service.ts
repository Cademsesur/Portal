import { Injectable } from '@nestjs/common';
import { StorageService } from '../../files/storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestSignatures } from '../infrastructure/docx-renderer';

export interface SignatureStatus {
  /** Une décision (approbation/rejet) a-t-elle été rendue ? */
  decided: boolean;
  /** Le demandeur a-t-il enregistré sa signature ? */
  requesterSigned: boolean;
  /** L'approbateur (DAF) a-t-il enregistré sa signature ? */
  approverSigned: boolean;
  /** Document exportable : décidé ET les deux signatures présentes. */
  canExport: boolean;
}

/**
 * Résout les signatures à apposer sur la fiche d'une demande :
 * - demandeur   → signature du créateur de la demande
 * - approbateur → signature du DAF ayant rendu la dernière décision
 */
@Injectable()
export class RequestSignatureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async keys(
    requestId: string,
  ): Promise<{ demandeurKey: string | null; approbateurKey: string | null }> {
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      select: {
        requester: { select: { signatureKey: true } },
        approvals: {
          where: { decision: { in: ['APPROVED', 'REJECTED'] } },
          orderBy: { decidedAt: 'desc' },
          take: 1,
          select: { approver: { select: { signatureKey: true } } },
        },
      },
    });
    return {
      demandeurKey: request?.requester?.signatureKey ?? null,
      approbateurKey: request?.approvals?.[0]?.approver?.signatureKey ?? null,
    };
  }

  /** Présence des signatures + éligibilité à l'export (sans charger les images). */
  async status(requestId: string, decided: boolean): Promise<SignatureStatus> {
    const { demandeurKey, approbateurKey } = await this.keys(requestId);
    const requesterSigned = Boolean(demandeurKey);
    const approverSigned = Boolean(approbateurKey);
    return {
      decided,
      requesterSigned,
      approverSigned,
      canExport: decided && requesterSigned && approverSigned,
    };
  }

  /** Charge les images de signature (best-effort). */
  async resolve(requestId: string): Promise<RequestSignatures> {
    const { demandeurKey, approbateurKey } = await this.keys(requestId);
    const [demandeur, approbateur] = await Promise.all([
      demandeurKey ? this.storage.getObject(demandeurKey) : Promise.resolve(null),
      approbateurKey ? this.storage.getObject(approbateurKey) : Promise.resolve(null),
    ]);
    return { demandeur, approbateur };
  }
}
