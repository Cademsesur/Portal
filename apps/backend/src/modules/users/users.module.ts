import { Module } from '@nestjs/common';
import { SignatureService } from './application/signature.service';
import { UsersController } from './interfaces/users.controller';

/**
 * Module USERS — compte de l'utilisateur courant, dont sa signature manuscrite
 * (PrismaService et StorageService sont fournis globalement).
 */
@Module({
  controllers: [UsersController],
  providers: [SignatureService],
})
export class UsersModule {}
