import { z } from 'zod';
import { Role } from '../enums';

export const userSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.nativeEnum(Role),
  departmentId: z.string().cuid().nullable(),
  isActive: z.boolean(),
});
export type User = z.infer<typeof userSchema>;

export const adminUpsertUserSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role).default(Role.EMPLOYEE),
  departmentId: z.string().cuid().optional(),
});
export type AdminUpsertUserDto = z.infer<typeof adminUpsertUserSchema>;
