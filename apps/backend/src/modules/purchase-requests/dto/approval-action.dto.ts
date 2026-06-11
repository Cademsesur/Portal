import { createZodDto } from 'nestjs-zod';
import { approvalActionSchema } from '@sesur/shared';

export class ApprovalActionDto extends createZodDto(approvalActionSchema) {}
