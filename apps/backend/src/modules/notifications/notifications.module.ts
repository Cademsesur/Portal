import { Module } from '@nestjs/common';
import { DocumentsModule } from '../documents/documents.module';
import { FilesModule } from '../files/files.module';
import { PurchaseRequestMailerListener } from './application/purchase-request-mailer.listener';

@Module({
  imports: [DocumentsModule, FilesModule],
  providers: [PurchaseRequestMailerListener],
})
export class NotificationsModule {}
