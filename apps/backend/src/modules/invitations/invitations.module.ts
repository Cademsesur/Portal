import { Module } from '@nestjs/common';
import { CreateInvitationUseCase } from './application/create-invitation.usecase';
import { ListInvitationsUseCase } from './application/list-invitations.usecase';
import { ResendInvitationUseCase } from './application/resend-invitation.usecase';
import { RevokeInvitationUseCase } from './application/revoke-invitation.usecase';
import { InvitationsController } from './interfaces/invitations.controller';

@Module({
  controllers: [InvitationsController],
  providers: [
    CreateInvitationUseCase,
    ListInvitationsUseCase,
    ResendInvitationUseCase,
    RevokeInvitationUseCase,
  ],
  exports: [CreateInvitationUseCase],
})
export class InvitationsModule {}
