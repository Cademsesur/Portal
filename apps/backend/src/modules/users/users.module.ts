import { Module } from '@nestjs/common';

/**
 * Module USERS.
 * Couches prévues :
 *  - domain/         entités User, value objects (Email, Role)
 *  - application/    use cases (ListUsersUseCase, AdminUpsertUserUseCase, ...)
 *  - infrastructure/ user.repository.ts (adapter Prisma)
 *  - interfaces/     users.controller.ts (HTTP)
 */
@Module({})
export class UsersModule {}
