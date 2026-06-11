import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toPurchaseRequestSummary, type PurchaseRequestSummary } from './purchase-request.mapper';

@Injectable()
export class ListMyRequestsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(requesterId: string): Promise<PurchaseRequestSummary[]> {
    const rows = await this.prisma.purchaseRequest.findMany({
      where: { requesterId },
      orderBy: { createdAt: 'desc' },
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
