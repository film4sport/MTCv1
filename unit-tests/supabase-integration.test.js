import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

describe('Supabase Integration — File Structure', () => {
  const requiredFiles = [
    'app/lib/supabase.ts',
    'app/dashboard/lib/auth.ts',
    'app/dashboard/lib/db.ts',
    'middleware.ts',
    'supabase/schema.sql',
    'supabase/rls.sql',
    'supabase/seed.sql',
  ];

  requiredFiles.forEach(file => {
    it(`${file} exists`, () => {
      expect(existsSync(resolve(root, file))).toBe(true);
    });
  });
});

describe('Supabase Client — supabase.ts', () => {
  const content = readFileSync(resolve(root, 'app/lib/supabase.ts'), 'utf-8');

  it('uses createBrowserClient from @supabase/ssr', () => {
    expect(content).toContain('createBrowserClient');
    expect(content).toContain('@supabase/ssr');
  });

  it('reads env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(content).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  });

  it('has fallback placeholders for build-time safety', () => {
    expect(content).toContain('placeholder');
  });

  it('exports a supabase client instance', () => {
    expect(content).toMatch(/export\s+(const|let)\s+supabase/);
  });
});

describe('Auth Module — auth.ts', () => {
  const content = readFileSync(resolve(root, 'app/dashboard/lib/auth.ts'), 'utf-8');

  it('exports signIn function', () => {
    expect(content).toMatch(/export\s+(async\s+)?function\s+signIn/);
  });

  it('exports signOut function', () => {
    expect(content).toMatch(/export\s+(async\s+)?function\s+signOut/);
  });

  it('exports signUp function', () => {
    expect(content).toMatch(/export\s+(async\s+)?function\s+signUp/);
  });

  it('exports resetPassword function', () => {
    expect(content).toMatch(/export\s+(async\s+)?function\s+resetPassword/);
  });

  it('uses supabase.auth methods', () => {
    expect(content).toContain('supabase.auth');
  });

  it('does not export CREDENTIALS constant', () => {
    expect(content).not.toMatch(/export\s+(const|let|var)\s+CREDENTIALS/);
  });
});

describe('Database Layer — db.ts', () => {
  const content = readFileSync(resolve(root, 'app/dashboard/lib/db.ts'), 'utf-8');

  it('imports supabase client', () => {
    expect(content).toContain('supabase');
  });

  it('has booking functions', () => {
    expect(content).toContain('fetchBookings');
    expect(content).toContain('createBooking');
  });

  it('has notification functions', () => {
    expect(content).toContain('createNotification');
  });

  it('has message functions', () => {
    expect(content).toContain('sendMessage');
  });
});

describe('Middleware — middleware.ts', () => {
  const content = readFileSync(resolve(root, 'middleware.ts'), 'utf-8');

  it('protects dashboard routes', () => {
    expect(content).toContain('/dashboard');
  });

  it('redirects to login when not authenticated', () => {
    expect(content).toContain('/login');
  });

  it('has route matcher config', () => {
    expect(content).toContain('matcher');
  });
});

describe('Database Schema — schema.sql', () => {
  const content = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf-8');

  it('creates profiles table', () => {
    expect(content.toLowerCase()).toContain('create table');
    expect(content).toContain('profiles');
  });

  it('creates bookings table', () => {
    expect(content).toContain('bookings');
  });

  it('creates events table', () => {
    expect(content).toContain('events');
  });

  it('creates conversations table', () => {
    expect(content).toContain('conversations');
  });

  it('creates messages table', () => {
    expect(content).toContain('messages');
  });

  it('creates notifications table', () => {
    expect(content).toContain('notifications');
  });
});

describe('RLS Policies — rls.sql', () => {
  const content = readFileSync(resolve(root, 'supabase/rls.sql'), 'utf-8');

  it('enables RLS on tables', () => {
    expect(content.toLowerCase()).toContain('enable row level security');
  });

  it('creates policies', () => {
    expect(content.toLowerCase()).toContain('create policy');
  });

  it('has admin helper function', () => {
    expect(content).toContain('is_admin');
  });
});

describe('Service Worker — Supabase bypass', () => {
  const content = readFileSync(resolve(root, 'public/sw.js'), 'utf-8');

  it('skips Supabase API calls from caching', () => {
    expect(content).toContain('supabase.co');
  });
});

describe('CSP — next.config.js', () => {
  const content = readFileSync(resolve(root, 'next.config.js'), 'utf-8');

  it('allows Supabase in connect-src', () => {
    expect(content).toContain('*.supabase.co');
    expect(content).toContain('wss://*.supabase.co');
  });

  it('only allows unsafe-eval conditionally for dev mode', () => {
    // unsafe-eval is needed for Next.js HMR/React hydration in dev mode
    // Verify it's behind an isDev conditional, not hardcoded into the CSP
    expect(content).toContain('isDev');
    expect(content).toContain("'unsafe-eval'");
    // Ensure the conditional pattern exists (isDev ? " 'unsafe-eval'" : '')
    expect(content).toMatch(/isDev\s*\?\s*.*unsafe-eval.*:\s*['"]['"]/)
  });
});
