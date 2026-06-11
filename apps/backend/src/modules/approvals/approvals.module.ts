import { Module } from '@nestjs/common';
import { DecideRequestUseCase } from './application/decide-request.usecase';

@Module({
  providers: [DecideRequestUseCase],
  exports: [DecideRequestUseCase],
})
export class ApprovalsModule {}
