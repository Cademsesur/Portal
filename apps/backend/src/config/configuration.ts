export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.BACKEND_PORT ?? '4000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL ?? 'http://localhost:4000',

  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },

  entra: {
    tenantId: process.env.ENTRA_TENANT_ID!,
    clientId: process.env.ENTRA_CLIENT_ID!,
    clientSecret: process.env.ENTRA_CLIENT_SECRET!,
    redirectUri: process.env.ENTRA_REDIRECT_URI!,
    allowedDomains: (process.env.ENTRA_ALLOWED_EMAIL_DOMAINS ?? 'sesur.com,sesur.bj')
      .split(',')
      .map((d) => d.trim().toLowerCase()),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },

  auth: {
    superadminEmails: (process.env.SUPERADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    crossSite: process.env.CROSS_SITE_AUTH === 'true',
  },

  mail: {
    from: process.env.MAIL_FROM ?? 'noreply@sesur.bj',
    fromName: process.env.MAIL_FROM_NAME || undefined,
    smtpHost: process.env.SMTP_HOST ?? 'localhost',
    smtpPort: parseInt(process.env.SMTP_PORT ?? '1025', 10),
    smtpUser: process.env.SMTP_USER || undefined,
    smtpPassword: process.env.SMTP_PASSWORD || undefined,
    smtpSecure: process.env.SMTP_SECURE === 'true',
  },

  storage: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? 'sesur-flow',
    accessKey: process.env.S3_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
    useSsl: process.env.S3_USE_SSL === 'true',
  },
});
