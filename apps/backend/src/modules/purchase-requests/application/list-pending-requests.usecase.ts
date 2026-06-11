import { Injectable } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toPurchaseRequestSummary, type PurchaseRequestSummary } from './purchase-request.mapper';

@Injectable()
export class ListPendingRequestsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<PurchaseRequestSummary[]> {
    const rows = await this.prisma.purchaseRequest.findMany({
      where: {
        status: { in: [RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW] },
      },
      orderBy: { submittedAt: 'asc' },
      include: {
        items: { select: { id: true } },
        approvals: { orderBy: { createdAt: 'desc' } },
      },
    });

    return rows.map((row) =>
      toPurchaseRequestSummary({
        ...row,
        items: row.items as never,
        approvals: row.approvals,
      }),
    );
  }
}
