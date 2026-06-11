import { createZodDto } from 'nestjs-zod';
import { createPurchaseRequestSchema } from '@sesur/shared';

export class CreatePurchaseRequestDto extends createZodDto(createPurchaseRequestSchema) {}
