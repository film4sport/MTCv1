import { describe, it, expect } from 'vitest';

describe('Validation patterns', () => {
  // Email regex from auth.js
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  describe('Email validation', () => {
    it('accepts valid email', () => {
      expect(emailRegex.test('user@example.com')).toBe(true);
    });

    it('accepts email with subdomain', () => {
      expect(emailRegex.test('user@mail.example.com')).toBe(true);
    });

    it('rejects email without @', () => {
      expect(emailRegex.test('userexample.com')).toBe(false);
    });

    it('rejects email without domain', () => {
      expect(emailRegex.test('user@')).toBe(false);
    });

    it('rejects email with spaces', () => {
      expect(emailRegex.test('user @example.com')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(emailRegex.test('')).toBe(false);
    });
  });

  // Phone regex from auth.js
  const phoneRegex = /^[\d\s\-\(\)\+]{7,}$/;

  describe('Phone validation', () => {
    it('accepts standard phone number', () => {
      expect(phoneRegex.test('555-123-4567')).toBe(true);
    });

    it('accepts phone with parentheses', () => {
      expect(phoneRegex.test('(555) 123-4567')).toBe(true);
    });

    it('accepts international format', () => {
      expect(phoneRegex.test('+1 555 123 4567')).toBe(true);
    });

    it('rejects too-short number', () => {
      expect(phoneRegex.test('12345')).toBe(false);
    });

    it('rejects letters', () => {
      expect(phoneRegex.test('abc-def-ghij')).toBe(false);
    });
  });

  describe('Password validation', () => {
    // Password minimum length from auth.js
    const MIN_PASSWORD_LENGTH = 6;

    it('accepts password of minimum length', () => {
      expect('123456'.length >= MIN_PASSWORD_LENGTH).toBe(true);
    });

    it('rejects password below minimum', () => {
      expect('12345'.length >= MIN_PASSWORD_LENGTH).toBe(false);
    });

    it('accepts long password', () => {
      expect('mySecurePassword123!'.length >= MIN_PASSWORD_LENGTH).toBe(true);
    });
  });

  describe('Name validation', () => {
    const MIN_NAME_LENGTH = 2;

    it('accepts valid name', () => {
      expect('Alex'.length >= MIN_NAME_LENGTH).toBe(true);
    });

    it('rejects single character', () => {
      expect('A'.length >= MIN_NAME_LENGTH).toBe(false);
    });

    it('accepts two character name', () => {
      expect('Al'.length >= MIN_NAME_LENGTH).toBe(true);
    });
  });
});
