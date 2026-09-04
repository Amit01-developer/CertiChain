import { describe, expect, it } from 'vitest';
import { normalizeBaseUrl, resolveEmailProvider, sanitizeCredential } from '../config/env';

describe('email config normalization', () => {
  it('removes spaces from SMTP app passwords', () => {
    expect(sanitizeCredential('lqdz ujty wqpj ouxy')).toBe('lqdzujtywqpjouxy');
  });

  it('defaults to SMTP when SMTP host is configured even without an explicit provider', () => {
    expect(resolveEmailProvider('', 'smtp.gmail.com')).toBe('smtp');
    expect(resolveEmailProvider(undefined, 'smtp.gmail.com')).toBe('smtp');
  });

  it('normalizes the frontend origin without trailing slashes', () => {
    expect(normalizeBaseUrl('https://certi-chain-1.vercel.app/')).toBe('https://certi-chain-1.vercel.app');
  });
});
