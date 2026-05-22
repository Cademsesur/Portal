import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@sesur/shared';
import { CurrentUser, type AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CreateInvitationUseCase } from '../application/create-invitation.usecase';
import { ListInvitationsUseCase } from '../application/list-invitations.usecase';
import { ResendInvitationUseCase } from '../application/resend-invitation.usecase';
import { RevokeInvitationUseCase } from '../application/revoke-invitation.usecase';
import { CreateInvitationDto } from '../dto/create-invitation.dto';

@ApiTags('invitations')
@Controller('invitations')
@Roles(Role.SUPER_ADMIN)
export class InvitationsController {
  constructor(
    private readonly createInvitation: CreateInvitationUseCase,
    private readonly listInvitations: ListInvitationsUseCase,
    private readonly resendInvitation: ResendInvitationUseCase,
    private readonly revokeInvitation: RevokeInvitationUseCase,
  ) {}

  @Get()
  list() {
    return this.listInvitations.execute();
  }

  @Post()
  create(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.createInvitation.execute(dto, user.id);
  }

  @Post(':id/resend')
  resend(@Param('id') id: string) {
    return this.resendInvitation.execute(id);
  }

  @Delete(':id')
  revoke(@Param('id') id: string) {
    return this.revokeInvitation.execute(id);
  }
}
