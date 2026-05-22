import { z } from 'zod';
import { RequestType } from '../enums';

export const createPurchaseRequestSchema = z.object({
  type: z.nativeEnum(RequestType),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  quantity: z.number().int().positive(),
  estimatedBudget: z.number().positive(),
  currency: z.string().length(3).default('XOF'),
  justification: z.string().min(10).max(5000),
  attachmentIds: z.array(z.string().cuid()).optional(),
});
export type CreatePurchaseRequestDto = z.infer<typeof createPurchaseRequestSchema>;

export const updatePurchaseRequestSchema = createPurchaseRequestSchema.partial();
export type UpdatePurchaseRequestDto = z.infer<typeof updatePurchaseRequestSchema>;

export const approvalActionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().max(2000).optional(),
});
export type ApprovalActionDto = z.infer<typeof approvalActionSchema>;
