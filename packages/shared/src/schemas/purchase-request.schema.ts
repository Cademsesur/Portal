import { z } from 'zod';
import { PurchaseType } from '../enums';

export const purchaseItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive(),
  specifications: z.string().trim().optional().default(''),
  desiredDeadline: z.string().trim().optional().default(''),
  observations: z.string().trim().optional().default(''),
});
export type PurchaseItem = z.infer<typeof purchaseItemSchema>;

export const createPurchaseRequestSchema = z
  .object({
    requesterName: z.string().trim().min(2),
    department: z.string().trim().min(2),
    jobTitle: z.string().trim().min(2),
    lineManager: z.string().trim().min(2),

    purchaseTypes: z.array(z.nativeEnum(PurchaseType)).min(1),
    otherTypeDetail: z.string().trim().optional().default(''),
    description: z.string().trim().min(10),

    objective: z.string().trim().min(5),
    operationalImpact: z.string().trim().min(5),
    endUser: z.string().trim().min(2),

    items: z.array(purchaseItemSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.purchaseTypes.includes(PurchaseType.OTHER) && data.otherTypeDetail.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otherTypeDetail'],
        message: 'Précisez le type "Autre"',
      });
    }
  });
export type CreatePurchaseRequestDto = z.infer<typeof createPurchaseRequestSchema>;

export const approvalActionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().max(2000).optional(),
});
export type ApprovalActionDto = z.infer<typeof approvalActionSchema>;
