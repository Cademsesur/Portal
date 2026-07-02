import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const setSignatureSchema = z.object({
  // Image PNG encodée en data URL (produite par l'upload ou le pavé de dessin).
  image: z
    .string()
    .regex(/^data:image\/png;base64,/, 'Image PNG (data URL) attendue'),
});

export class SetSignatureDto extends createZodDto(setSignatureSchema) {}
