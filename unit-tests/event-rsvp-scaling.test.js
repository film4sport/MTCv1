import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');

function read(path) {
  return readFileSync(resolve(root, path), 'utf-8');
}

describe('Event RSVP surge hardening', () => {
  const route = read('app/api/mobile/events/route.ts');
  const mobileEvents = read('public/mobile-app/js/events.js');
  const migration = read('supabase/migrations/20260320_atomic_event_rsvp.sql');
  const schema = read('supabase/schema.sql');

  it('adds an atomic RSVP function in the database', () => {
    expect(migration).toContain('create or replace function public.toggle_event_rsvp_atomic');
    expect(migration).toContain("pg_advisory_xact_lock(hashtext('event-rsvp:' || p_event_id))");
    expect(migration).toContain("select e.title, e.date, e.spots_total");
  });

  it('returns a full action from the function instead of oversubscribing spots', () => {
    expect(migration).toContain("select 'full'::text");
    expect(migration).toContain('if v_spots_taken >= v_spots_total then');
  });

  it('stores user_id on event attendees with a uniqueness guard', () => {
    expect(migration).toContain('add column if not exists user_id uuid');
    expect(migration).toContain('create unique index if not exists event_attendees_event_id_user_id_key');
    expect(schema).toContain('user_id uuid references profiles(id) on delete set null');
  });

  it('calls the atomic database function from the API route', () => {
    expect(route).toContain("rpc('toggle_event_rsvp_atomic'");
    expect(route).toContain("if (toggleResult.action === 'full')");
    expect(route).toContain("if (toggleResult.action === 'removed')");
  });

  it('keeps the client from spamming duplicate RSVP taps for the same event', () => {
    expect(mobileEvents).toContain('var pendingEventRsvps = new Set();');
    expect(mobileEvents).toContain('if (pendingEventRsvps.has(eventId)) return;');
    expect(mobileEvents).toContain('pendingEventRsvps.add(eventId);');
    expect(mobileEvents).toContain('pendingEventRsvps.delete(eventId);');
  });

  it('rolls back optimistic RSVP state on network failure and missing auth', () => {
    expect(mobileEvents).toContain("showToast('Network error — please try again', 'error');");
    expect(mobileEvents).toContain("showToast('Please sign in again to RSVP', 'error');");
    expect(mobileEvents).toContain('renderEventModal(event);');
  });
});
