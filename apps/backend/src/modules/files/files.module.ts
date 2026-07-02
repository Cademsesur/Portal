import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Module FILES — stockage objet S3/MinIO (documents générés, signatures…).
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class FilesModule {}
