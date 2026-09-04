import { describe, it, expect } from 'vitest';
import { isValidPhone } from './validation.js';

describe('isValidPhone', () => {
  it('accepts a dash-formatted 10-digit number', () => {
    expect(isValidPhone('555-123-4567')).toBe(true);
  });

  it('accepts a parenthesized 10-digit number', () => {
    expect(isValidPhone('(555) 123 4567')).toBe(true);
  });

  it('accepts a plain 10-digit number', () => {
    expect(isValidPhone('5551234567')).toBe(true);
  });

  it('rejects a single digit', () => {
    expect(isValidPhone('1')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidPhone('')).toBe(false);
  });

  it('rejects 9 digits (one short)', () => {
    expect(isValidPhone('555-123-456')).toBe(false);
  });

  it('rejects 11 digits (one too many)', () => {
    expect(isValidPhone('555-123-45678')).toBe(false);
  });

  it('rejects null/undefined input', () => {
    expect(isValidPhone(null)).toBe(false);
    expect(isValidPhone(undefined)).toBe(false);
  });
});
