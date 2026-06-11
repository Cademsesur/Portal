import { randomBytes } from 'node:crypto';

export function generatePurchaseRequestReference(now: Date = new Date()): string {
  const yyyymm = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `REQ-${yyyymm}-${suffix}`;
}
