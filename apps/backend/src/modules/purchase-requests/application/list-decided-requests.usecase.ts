import { Injectable } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toPurchaseRequestSummary, type PurchaseRequestSummary } from './purchase-request.mapper';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ListDecidedRequestsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(days: number): Promise<PurchaseRequestSummary[]> {
    const since = new Date(Date.now() - days * DAY_MS);
    const rows = await this.prisma.purchaseRequest.findMany({
      where: {
        status: { in: [RequestStatus.APPROVED, RequestStatus.REJECTED] },
        closedAt: { gte: since },
      },
      orderBy: { closedAt: 'desc' },
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
