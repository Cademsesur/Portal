import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@sesur/shared';
import { toPurchaseRequestDetail, type PurchaseRequestDetail } from './purchase-request.mapper';

const DECISION_ROLES: Role[] = [Role.DAF];

@Injectable()
export class GetPurchaseRequestUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    id: string,
    viewerId: string,
    viewerRole: Role,
  ): Promise<PurchaseRequestDetail> {
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        items: { orderBy: { position: 'asc' } },
        approvals: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!request) {
      throw new NotFoundException("Demande d'achat introuvable");
    }
    const isOwner = request.requesterId === viewerId;
    const canDecide = DECISION_ROLES.includes(viewerRole);
    if (!isOwner && !canDecide) {
      throw new ForbiddenException("Accès interdit à cette demande");
    }
    return toPurchaseRequestDetail(request);
  }
}
