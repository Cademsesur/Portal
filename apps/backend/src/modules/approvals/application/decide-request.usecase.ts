import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalDecision,
  ApprovalStep,
  RequestStatus,
} from '@prisma/client';
import { Role } from '@sesur/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  toPurchaseRequestDetail,
  type PurchaseRequestDetail,
} from '../../purchase-requests/application/purchase-request.mapper';

const DECIDER_ROLES: Role[] = [Role.DAF, Role.SUPER_ADMIN];

interface DecideInput {
  requestId: string;
  approverId: string;
  approverRole: Role;
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
}

@Injectable()
export class DecideRequestUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: DecideInput): Promise<PurchaseRequestDetail> {
    if (!DECIDER_ROLES.includes(input.approverRole)) {
      throw new ForbiddenException("Seuls les DAF peuvent valider une demande");
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.purchaseRequest.findUnique({
        where: { id: input.requestId },
      });
      if (!request) {
        throw new NotFoundException("Demande d'achat introuvable");
      }
      if (
        request.status !== RequestStatus.SUBMITTED &&
        request.status !== RequestStatus.UNDER_REVIEW
      ) {
        throw new BadRequestException(
          `Impossible de décider sur une demande au statut ${request.status}`,
        );
      }

      const now = new Date();
      const nextStatus =
        input.decision === 'APPROVED'
          ? RequestStatus.APPROVED
          : RequestStatus.REJECTED;

      await tx.approval.create({
        data: {
          requestId: request.id,
          approverId: input.approverId,
          step: ApprovalStep.DAF,
          decision:
            input.decision === 'APPROVED'
              ? ApprovalDecision.APPROVED
              : ApprovalDecision.REJECTED,
          comment: input.comment?.trim() || null,
          decidedAt: now,
        },
      });

      const updated = await tx.purchaseRequest.update({
        where: { id: request.id },
        data: {
          status: nextStatus,
          currentStep: ApprovalStep.DAF,
          closedAt: now,
        },
        include: {
          items: { orderBy: { position: 'asc' } },
          approvals: { orderBy: { createdAt: 'desc' } },
        },
      });

      return toPurchaseRequestDetail(updated);
    });
  }
}
