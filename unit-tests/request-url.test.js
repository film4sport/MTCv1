import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getRequestOrigin, getSiteUrl } from '../app/api/lib/request-url';

describe('request-url helpers', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
  });

  it('prefers forwarded host and protocol when present', () => {
    const request = new Request('http://internal:3000/api/mobile/bookings', {
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'www.monotennisclub.com',
      },
    });

    expect(getRequestOrigin(request)).toBe('https://www.monotennisclub.com');
  });

  it('falls back to request.url origin when forwarded headers are absent', () => {
    const request = new Request('http://127.0.0.1:3001/api/mobile/bookings');
    expect(getRequestOrigin(request)).toBe('http://127.0.0.1:3001');
  });

  it('returns configured site url when present', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://app.example.com';
    expect(getSiteUrl()).toBe('https://app.example.com');
  });

  it('falls back to the production site url when env is missing', () => {
    expect(getSiteUrl()).toBe('https://www.monotennisclub.com');
  });
});
