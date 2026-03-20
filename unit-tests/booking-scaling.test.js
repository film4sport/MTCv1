import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

const route = readFileSync(resolve(root, 'app/api/mobile/bookings/route.ts'), 'utf-8');
const schema = readFileSync(resolve(root, 'supabase/schema.sql'), 'utf-8');
const migration = readFileSync(resolve(root, 'supabase/migrations/20260320_booking_request_hardening.sql'), 'utf-8');
const apiClient = readFileSync(resolve(root, 'public/mobile-app/js/api-client.js'), 'utf-8');

describe('Booking Surge Hardening', () => {
  it('adds client request id dedupe to bookings schema', () => {
    expect(schema).toContain('client_request_id text');
    expect(schema).toContain('bookings_user_id_client_request_id_key');
    expect(migration).toContain('bookings_user_id_client_request_id_key');
  });

  it('dedupes participant rows at the database level', () => {
    expect(schema).toContain('booking_participants_booking_id_participant_id_key');
    expect(migration).toContain('booking_participants_booking_id_participant_id_key');
  });

  it('creates bookings through an atomic booking RPC', () => {
    expect(route).toContain("rpc('create_booking_atomic'");
    expect(schema).toContain('create or replace function create_booking_atomic');
    expect(migration).toContain('create or replace function public.create_booking_atomic');
  });

  it('locks booking creation per court and date before checking conflicts', () => {
    expect(schema).toContain("pg_advisory_xact_lock(hashtext('booking:'");
    expect(migration).toContain("pg_advisory_xact_lock(hashtext('booking:'");
  });

  it('checks overlap using duration-aware time windows', () => {
    expect(schema).toMatch(/requested_start_minutes <[\s\S]*coalesce\(b\.duration, 1\)/);
    expect(route).toContain('This slot was just booked by someone else');
  });

  it('dedupes participant inserts in the route', () => {
    expect(route).toContain("onConflict: 'booking_id,participant_id'");
    expect(route).toContain('new Map(validParticipants.map');
  });

  it('sends stable client request ids from the mobile app', () => {
    expect(apiClient).toContain('clientRequestId');
    expect(apiClient).toContain('window.crypto.randomUUID');
  });

  it('normalizes booking notification conversations before creating them', () => {
    expect(route).toContain('normalizeConversationMembers');
    expect(route).toContain(".eq('member_a', memberA)");
    expect(route).toContain(".eq('member_b', memberB)");
  });
});
