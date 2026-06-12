import { Module } from '@nestjs/common';
import { ApprovalsModule } from '../approvals/approvals.module';
import { CreatePurchaseRequestUseCase } from './application/create-purchase-request.usecase';
import { GetPurchaseRequestUseCase } from './application/get-purchase-request.usecase';
import { ListDecidedRequestsUseCase } from './application/list-decided-requests.usecase';
import { ListMyRequestsUseCase } from './application/list-my-requests.usecase';
import { ListPendingRequestsUseCase } from './application/list-pending-requests.usecase';
import { PurchaseRequestsController } from './interfaces/purchase-requests.controller';

@Module({
  imports: [ApprovalsModule],
  controllers: [PurchaseRequestsController],
  providers: [
    CreatePurchaseRequestUseCase,
    GetPurchaseRequestUseCase,
    ListDecidedRequestsUseCase,
    ListMyRequestsUseCase,
    ListPendingRequestsUseCase,
  ],
})
export class PurchaseRequestsModule {}
