import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PURCHASE_REQUEST_SUBMITTED,
  type PurchaseRequestSubmittedEvent,
} from '../domain/events';
import type { CreatePurchaseRequestDto } from '../dto/create-purchase-request.dto';
import { generatePurchaseRequestReference } from '../infrastructure/reference-generator';
import { toPurchaseRequestDetail, type PurchaseRequestDetail } from './purchase-request.mapper';

interface ExecuteOptions {
  submit?: boolean;
}

@Injectable()
export class CreatePurchaseRequestUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(
    dto: CreatePurchaseRequestDto,
    requesterId: string,
    options: ExecuteOptions = {},
  ): Promise<PurchaseRequestDetail> {
    const submit = options.submit ?? true;
    const now = new Date();

    const request = await this.prisma.purchaseRequest.create({
      data: {
        reference: generatePurchaseRequestReference(now),
        requesterId,
        requesterName: dto.requesterName,
        department: dto.department,
        jobTitle: dto.jobTitle,
        lineManager: dto.lineManager,
        purchaseTypes: dto.purchaseTypes,
        otherTypeDetail: dto.otherTypeDetail || null,
        description: dto.description,
        objective: dto.objective,
        operationalImpact: dto.operationalImpact,
        endUser: dto.endUser,
        status: submit ? RequestStatus.SUBMITTED : RequestStatus.DRAFT,
        submittedAt: submit ? now : null,
        items: {
          create: dto.items.map((item, index) => ({
            position: index,
            description: item.description,
            quantity: item.quantity,
            specifications: item.specifications ?? '',
            desiredDeadline: item.desiredDeadline ?? '',
            observations: item.observations ?? '',
          })),
        },
      },
      include: {
        items: { orderBy: { position: 'asc' } },
        approvals: { orderBy: { createdAt: 'desc' } },
        requester: { select: { email: true } },
      },
    });

    if (submit) {
      const event: PurchaseRequestSubmittedEvent = {
        requestId: request.id,
        reference: request.reference,
        requesterId: request.requesterId,
        requesterName: request.requesterName,
        requesterEmail: request.requester.email,
        department: request.department,
        description: request.description,
      };
      this.events.emit(PURCHASE_REQUEST_SUBMITTED, event);
    }

    return toPurchaseRequestDetail(request);
  }
}
