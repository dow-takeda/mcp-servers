import { describe, it, expect } from 'vitest';
import { generatePrivateTokenAuth, generateBearerAuth } from './auth.js';

describe('generatePrivateTokenAuth', () => {
  it('should return the token as-is for PRIVATE-TOKEN header', () => {
    const token = 'glpat-test123';
    const result = generatePrivateTokenAuth(token);
    expect(result).toBe('glpat-test123');
  });

  it('should handle empty token', () => {
    const result = generatePrivateTokenAuth('');
    expect(result).toBe('');
  });
});

describe('generateBearerAuth', () => {
  it('should generate correct Bearer auth header', () => {
    const token = 'glpat-test123';
    const result = generateBearerAuth(token);
    expect(result).toBe('Bearer glpat-test123');
  });

  it('should handle empty token', () => {
    const result = generateBearerAuth('');
    expect(result).toBe('Bearer ');
  });
});
