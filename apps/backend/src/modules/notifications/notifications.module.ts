import { Module } from '@nestjs/common';
import { PurchaseRequestMailerListener } from './application/purchase-request-mailer.listener';

@Module({
  providers: [PurchaseRequestMailerListener],
})
export class NotificationsModule {}
