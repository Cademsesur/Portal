import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import {
  PURCHASE_REQUEST_DECIDED,
  type PurchaseRequestDecidedEvent,
} from '../../purchase-requests/domain/events';

const DECIDER_ROLES: Role[] = [Role.DAF];

interface DecideInput {
  requestId: string;
  approverId: string;
  approverRole: Role;
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
}

@Injectable()
export class DecideRequestUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(input: DecideInput): Promise<PurchaseRequestDetail> {
    if (!DECIDER_ROLES.includes(input.approverRole)) {
      throw new ForbiddenException("Seuls les DAF peuvent valider une demande");
    }

    const detail = await this.prisma.$transaction(async (tx) => {
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
          requester: { select: { email: true } },
        },
      });

      return {
        detail: toPurchaseRequestDetail(updated),
        requesterEmail: updated.requester.email,
        requesterName: updated.requesterName,
      };
    });

    const approver = await this.prisma.user.findUnique({
      where: { id: input.approverId },
      select: { displayName: true },
    });

    const event: PurchaseRequestDecidedEvent = {
      requestId: detail.detail.id,
      reference: detail.detail.reference,
      decision: input.decision,
      comment: input.comment?.trim() || null,
      requesterId: input.requestId,
      requesterEmail: detail.requesterEmail,
      requesterName: detail.requesterName,
      approverName: approver?.displayName ?? 'la DAF',
    };
    this.events.emit(PURCHASE_REQUEST_DECIDED, event);

    return detail.detail;
  }
}
