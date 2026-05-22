import { Module } from '@nestjs/common';

/**
 * Module PURCHASE_REQUESTS — cœur métier.
 *
 * Couches :
 *  - domain/
 *     - purchase-request.entity.ts        agrégat + invariants
 *     - state-machine.ts                  transitions DRAFT → ORDERED
 *     - ports/                            interfaces (repository, doc-generator)
 *  - application/
 *     - create-request.usecase.ts
 *     - submit-request.usecase.ts
 *     - list-requests.usecase.ts
 *  - infrastructure/
 *     - purchase-request.prisma.repository.ts
 *  - interfaces/
 *     - purchase-requests.controller.ts
 *  - dto/                                  DTOs Zod (validation HTTP)
 */
@Module({})
export class PurchaseRequestsModule {}
