import { describe, it, expect } from 'vitest';
import { generateCertificateId, hashCertificateData } from '../utils/certId';

describe('generateCertificateId', () => {
  it('generates an ID in the correct format', () => {
    const id = generateCertificateId();
    expect(id).toMatch(/^CC-\d{4}-[A-F0-9]{8}$/);
  });

  it('includes the current year', () => {
    const id   = generateCertificateId();
    const year = new Date().getFullYear().toString();
    expect(id).toContain(year);
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateCertificateId()));
    expect(ids.size).toBe(1000);
  });
});

describe('hashCertificateData', () => {
  it('produces a 64-char hex hash', async () => {
    const hash = await hashCertificateData({ id: 'test', name: 'Amit' });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces the same hash for the same data (key order independent)', async () => {
    const h1 = await hashCertificateData({ b: 2, a: 1 });
    const h2 = await hashCertificateData({ a: 1, b: 2 });
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different data', async () => {
    const h1 = await hashCertificateData({ id: 'a' });
    const h2 = await hashCertificateData({ id: 'b' });
    expect(h1).not.toBe(h2);
  });
});
