import { randomBytes } from 'crypto';

export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const hex  = randomBytes(4).toString('hex').toUpperCase();
  return `CC-${year}-${hex}`;
}

export async function hashCertificateData(data: object): Promise<string> {
  const { createHash } = await import('crypto');
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(canonical).digest('hex');
}
