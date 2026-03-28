import { describe, it, expect } from 'vitest';
import { generateBasicAuth } from './auth.js';

describe('generateBasicAuth', () => {
  it('should generate correct Basic Auth header', () => {
    const email = 'test@example.com';
    const apiToken = 'test-token';

    const result = generateBasicAuth(email, apiToken);

    // test@example.com:test-token in base64
    const expectedCredentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
    expect(result).toBe(`Basic ${expectedCredentials}`);
  });

  it('should handle special characters in credentials', () => {
    const email = 'user+test@example.com';
    const apiToken = 'token/with=special+chars';

    const result = generateBasicAuth(email, apiToken);

    expect(result).toMatch(/^Basic [A-Za-z0-9+/=]+$/);
  });

  it('should handle empty strings', () => {
    const result = generateBasicAuth('', '');

    // ':' in base64 is 'Og=='
    expect(result).toBe('Basic Og==');
  });
});
