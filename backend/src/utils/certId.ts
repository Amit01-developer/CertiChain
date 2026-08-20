import { randomBytes } from 'crypto';

/**
 * Generates a globally unique certificate ID.
 * Format: CC-{YEAR}-{8 random hex chars uppercase}
 * Example: CC-2026-A8F92D71
 *
 * The ID is URL-safe, difficult to guess, and encodes no database internals.
 */
export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const hex  = randomBytes(4).toString('hex').toUpperCase();
  return `CC-${year}-${hex}`;
}

/**
 * Generates a SHA-256 fingerprint of the certificate's canonical data.
 * Used as an optional tamper-evidence hash stored alongside the record.
 */
export async function hashCertificateData(data: object): Promise<string> {
  const { createHash } = await import('crypto');
  const canonical = JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(canonical).digest('hex');
}
