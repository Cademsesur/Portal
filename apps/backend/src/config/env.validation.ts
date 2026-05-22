import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  BACKEND_PORT: z.string().regex(/^\d+$/).default('4000'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  BACKEND_URL: z.string().url().default('http://localhost:4000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().regex(/^\d+$/).default('6379'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // Entra ID — optionnels au boot, requis pour activer le SSO
  ENTRA_TENANT_ID: z.string().optional(),
  ENTRA_CLIENT_ID: z.string().optional(),
  ENTRA_CLIENT_SECRET: z.string().optional(),
  ENTRA_REDIRECT_URI: z.string().url().optional(),
  ENTRA_ALLOWED_EMAIL_DOMAINS: z.string().default('sesur.com,sesur.bj'),

  // Emails promus automatiquement en SUPER_ADMIN au login SSO (CSV)
  SUPERADMIN_EMAILS: z.string().default(''),

  // true quand front et back sont sur des domaines différents (Vercel + tunnel/déploiement)
  // → cookies SameSite=None + Secure pour permettre les appels API cross-origin
  CROSS_SITE_AUTH: z.enum(['true', 'false']).default('false'),

  // SMTP
  MAIL_FROM: z.string().default('noreply@sesur.bj'),
  MAIL_FROM_NAME: z.string().optional(),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().regex(/^\d+$/).default('1025'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
});

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const formatted = parsed.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`❌ Invalid environment variables:\n${formatted}`);
  }
  return parsed.data;
}
