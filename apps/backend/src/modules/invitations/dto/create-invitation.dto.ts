import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Role } from '@sesur/shared';

export const createInvitationSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase()),
  role: z.enum([Role.EMPLOYEE, Role.DAF]),
});

export class CreateInvitationDto extends createZodDto(createInvitationSchema) {}
