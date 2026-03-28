import { describe, it, expect } from 'vitest';
import { generateBearerAuth, generateTokenAuth } from './auth.js';

describe('generateBearerAuth', () => {
  it('should generate correct Bearer auth header', () => {
    const token = 'ghp_test123';
    const result = generateBearerAuth(token);
    expect(result).toBe('Bearer ghp_test123');
  });

  it('should handle empty token', () => {
    const result = generateBearerAuth('');
    expect(result).toBe('Bearer ');
  });
});

describe('generateTokenAuth', () => {
  it('should generate correct token auth header', () => {
    const token = 'ghp_test123';
    const result = generateTokenAuth(token);
    expect(result).toBe('token ghp_test123');
  });

  it('should handle empty token', () => {
    const result = generateTokenAuth('');
    expect(result).toBe('token ');
  });
});
