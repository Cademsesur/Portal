import { z } from 'zod';

export const PURCHASE_TYPES = [
  { key: 'HARDWARE', label: 'Matériel informatique' },
  { key: 'FURNITURE', label: 'Mobilier' },
  { key: 'SUPPLIES', label: 'Fournitures' },
  { key: 'SERVICE', label: 'Prestation de service' },
  { key: 'MAINTENANCE', label: 'Maintenance' },
  { key: 'SOFTWARE', label: 'Logiciel' },
  { key: 'OTHER', label: 'Autre' },
] as const;

export type PurchaseTypeKey = (typeof PURCHASE_TYPES)[number]['key'];

export const purchaseItemSchema = z.object({
  description: z.string().trim().min(1, 'Requis'),
  quantity: z.coerce.number().int().positive('Doit être > 0'),
  specifications: z.string().trim().optional().default(''),
  desiredDeadline: z.string().trim().optional().default(''),
  observations: z.string().trim().optional().default(''),
});
export type PurchaseItem = z.infer<typeof purchaseItemSchema>;

export const purchaseRequestFormSchema = z
  .object({
    // 1. Identification
    requesterName: z.string().trim().min(2, 'Requis'),
    department: z.string().trim().min(2, 'Requis'),
    jobTitle: z.string().trim().min(2, 'Requis'),
    lineManager: z.string().trim().min(2, 'Requis'),

    // 2. Objet
    purchaseTypes: z
      .array(z.enum(PURCHASE_TYPES.map((t) => t.key) as [string, ...string[]]))
      .min(1, 'Sélectionnez au moins un type'),
    otherTypeDetail: z.string().trim().optional().default(''),
    description: z
      .string()
      .trim()
      .min(10, 'Décrivez les caractéristiques techniques (10 caractères min.)'),

    // 3. Justification & impact
    objective: z.string().trim().min(5, 'Requis'),
    operationalImpact: z.string().trim().min(5, 'Requis'),
    endUser: z.string().trim().min(2, 'Requis'),

    // 4. Articles
    items: z.array(purchaseItemSchema).min(1, 'Ajoutez au moins une ligne'),
  })
  .superRefine((data, ctx) => {
    if (data.purchaseTypes.includes('OTHER') && data.otherTypeDetail.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otherTypeDetail'],
        message: 'Précisez le type "Autre"',
      });
    }
  });

export type PurchaseRequestFormValues = z.infer<typeof purchaseRequestFormSchema>;

export const EMPTY_ITEM: PurchaseItem = {
  description: '',
  quantity: 1,
  specifications: '',
  desiredDeadline: '',
  observations: '',
};
