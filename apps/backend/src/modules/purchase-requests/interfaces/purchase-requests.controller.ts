import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@sesur/shared';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DecideRequestUseCase } from '../../approvals/application/decide-request.usecase';
import { CreatePurchaseRequestUseCase } from '../application/create-purchase-request.usecase';
import { GetPurchaseRequestUseCase } from '../application/get-purchase-request.usecase';
import { ListMyRequestsUseCase } from '../application/list-my-requests.usecase';
import { ListPendingRequestsUseCase } from '../application/list-pending-requests.usecase';
import { ApprovalActionDto } from '../dto/approval-action.dto';
import { CreatePurchaseRequestDto } from '../dto/create-purchase-request.dto';

@ApiTags('purchase-requests')
@Controller('purchase-requests')
export class PurchaseRequestsController {
  constructor(
    private readonly createRequest: CreatePurchaseRequestUseCase,
    private readonly listMyRequests: ListMyRequestsUseCase,
    private readonly listPendingRequests: ListPendingRequestsUseCase,
    private readonly getRequest: GetPurchaseRequestUseCase,
    private readonly decideRequest: DecideRequestUseCase,
  ) {}

  @Get('mine')
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.listMyRequests.execute(user.id);
  }

  @Get('pending')
  @Roles(Role.DAF, Role.SUPER_ADMIN)
  pending() {
    return this.listPendingRequests.execute();
  }

  @Get(':id')
  detail(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getRequest.execute(id, user.id, user.role);
  }

  @Post()
  create(
    @Body() dto: CreatePurchaseRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.createRequest.execute(dto, user.id);
  }

  @Post(':id/decision')
  @HttpCode(200)
  @Roles(Role.DAF, Role.SUPER_ADMIN)
  decide(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.decideRequest.execute({
      requestId: id,
      approverId: user.id,
      approverRole: user.role,
      decision: dto.decision,
      comment: dto.comment,
    });
  }
}
