import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DEFAULT_NOTIFICATION_PREFS, FEES } from '../app/dashboard/lib/types';
import { DEFAULT_COURTS } from '../app/dashboard/lib/data';

const typesFile = readFileSync(join(__dirname, '..', 'app', 'dashboard', 'lib', 'types.ts'), 'utf-8');
const dataFile = readFileSync(join(__dirname, '..', 'app', 'dashboard', 'lib', 'data.ts'), 'utf-8');
const headerFile = readFileSync(join(__dirname, '..', 'app', 'dashboard', 'components', 'DashboardHeader.tsx'), 'utf-8');
const dbFile = readFileSync(join(__dirname, '..', 'app', 'dashboard', 'lib', 'db.ts'), 'utf-8');
const settingsFile = readFileSync(join(__dirname, '..', 'app', 'dashboard', 'settings', 'page.tsx'), 'utf-8');
const infoFile = readFileSync(join(__dirname, '..', 'app', 'info', 'page.tsx'), 'utf-8');
const schemaFile = readFileSync(join(__dirname, '..', 'supabase', 'schema.sql'), 'utf-8');

// ─── Removed: payment notification type ─────────────────
describe('Dead Code: payment notifications removed', () => {
  it('Notification type should not include payment', () => {
    // Match the type union in the Notification interface
    const notifMatch = typesFile.match(/interface Notification[\s\S]*?type:\s*([^;]+);/);
    expect(notifMatch).toBeTruthy();
    expect(notifMatch[1]).not.toContain("'payment'");
  });

  it('NotificationPreferences should not have payments field', () => {
    expect(DEFAULT_NOTIFICATION_PREFS).not.toHaveProperty('payments');
  });

  it('NotificationPreferences should have exactly 5 keys', () => {
    const keys = Object.keys(DEFAULT_NOTIFICATION_PREFS);
    expect(keys).toHaveLength(5);
    expect(keys).toEqual(expect.arrayContaining(['bookings', 'events', 'partners', 'messages', 'programs']));
  });

  it('DashboardHeader prefMap should not contain payment', () => {
    expect(headerFile).not.toContain("payment: 'payments'");
    expect(headerFile).not.toContain('payment:');
  });

  it('DashboardHeader prefMap should map all 5 valid types', () => {
    expect(headerFile).toContain("booking: 'bookings'");
    expect(headerFile).toContain("event: 'events'");
    expect(headerFile).toContain("partner: 'partners'");
    expect(headerFile).toContain("message: 'messages'");
    expect(headerFile).toContain("program: 'programs'");
  });

  it('db.ts fetchNotificationPreferences should not return payments', () => {
    const fnMatch = dbFile.match(/fetchNotificationPreferences[\s\S]*?return\s*\{([\s\S]*?)\};/);
    expect(fnMatch).toBeTruthy();
    expect(fnMatch[1]).not.toContain('payments');
    // Should still return the 5 valid keys
    expect(fnMatch[1]).toContain('bookings');
    expect(fnMatch[1]).toContain('events');
    expect(fnMatch[1]).toContain('partners');
    expect(fnMatch[1]).toContain('messages');
    expect(fnMatch[1]).toContain('programs');
  });

  it('Settings page should not have Payments toggle', () => {
    expect(settingsFile).not.toContain('Payments');
    expect(settingsFile).not.toContain("key: 'payments'");
  });
});

// ─── Removed: ball-machine booking type ─────────────────
describe('Dead Code: ball-machine booking type removed', () => {
  it('Booking type union should not include ball-machine', () => {
    const bookingMatch = typesFile.match(/interface Booking[\s\S]*?type:\s*([^;]+);/);
    expect(bookingMatch).toBeTruthy();
    expect(bookingMatch[1]).not.toContain('ball-machine');
  });

  it('Booking type should have exactly 4 valid types', () => {
    const bookingMatch = typesFile.match(/interface Booking[\s\S]*?type:\s*([^;]+);/);
    expect(bookingMatch[1]).toContain("'court'");
    expect(bookingMatch[1]).toContain("'partner'");
    expect(bookingMatch[1]).toContain("'program'");
    expect(bookingMatch[1]).toContain("'lesson'");
  });

  it('schema.sql bookings type constraint should not include ball-machine', () => {
    const bookingsConstraint = schemaFile.match(/bookings[\s\S]*?type\s+text[^)]*check\s*\([^)]+\)/i);
    expect(bookingsConstraint).toBeTruthy();
    expect(bookingsConstraint[0]).not.toContain('ball-machine');
  });
});

// ─── Removed: in-use / reserved court statuses ─────────
describe('Dead Code: in-use/reserved court statuses removed', () => {
  it('Court interface should only allow available | maintenance', () => {
    const courtMatch = typesFile.match(/interface Court[\s\S]*?status:\s*([^;]+);/);
    expect(courtMatch).toBeTruthy();
    expect(courtMatch[1]).toContain("'available'");
    expect(courtMatch[1]).toContain("'maintenance'");
    expect(courtMatch[1]).not.toContain("'in-use'");
    expect(courtMatch[1]).not.toContain("'reserved'");
  });

  it('Court interface should not have currentUser, endsAt, startsIn', () => {
    const courtSection = typesFile.match(/interface Court\s*\{[\s\S]*?\}/);
    expect(courtSection).toBeTruthy();
    expect(courtSection[0]).not.toContain('currentUser');
    expect(courtSection[0]).not.toContain('endsAt');
    expect(courtSection[0]).not.toContain('startsIn');
  });

  it('DEFAULT_COURTS should all have status available', () => {
    DEFAULT_COURTS.forEach(court => {
      expect(court.status).toBe('available');
    });
  });

  it('DEFAULT_COURTS should not have currentUser, endsAt, startsIn props', () => {
    DEFAULT_COURTS.forEach(court => {
      expect(court).not.toHaveProperty('currentUser');
      expect(court).not.toHaveProperty('endsAt');
      expect(court).not.toHaveProperty('startsIn');
    });
  });

  it('DEFAULT_COURTS should have exactly 4 courts with correct shape', () => {
    expect(DEFAULT_COURTS).toHaveLength(4);
    DEFAULT_COURTS.forEach(court => {
      expect(Object.keys(court)).toEqual(expect.arrayContaining(['id', 'name', 'floodlight', 'status']));
      expect(Object.keys(court)).toHaveLength(4); // no extra props
    });
  });

  it('schema.sql courts status constraint should not include in-use or reserved', () => {
    const courtsConstraint = schemaFile.match(/courts[\s\S]*?status\s+text[^)]*check\s*\([^)]+\)/i);
    expect(courtsConstraint).toBeTruthy();
    expect(courtsConstraint[0]).not.toContain('in-use');
    expect(courtsConstraint[0]).not.toContain('reserved');
  });
});

// ─── Removed: tabWarning / tabBlock FEES constants ──────
describe('Dead Code: tabWarning/tabBlock FEES removed', () => {
  it('FEES should not have tabWarning', () => {
    expect(FEES).not.toHaveProperty('tabWarning');
  });

  it('FEES should not have tabBlock', () => {
    expect(FEES).not.toHaveProperty('tabBlock');
  });

  it('FEES should have exactly 3 keys', () => {
    const keys = Object.keys(FEES);
    expect(keys).toHaveLength(3);
    expect(keys).toEqual(expect.arrayContaining(['booking', 'guest', 'cancelWindowHours']));
  });
});

// ─── Schema: notifications constraint matches TypeScript ─
describe('Schema: notifications type constraint synced with code', () => {
  it('notifications CHECK should include program', () => {
    const notifConstraint = schemaFile.match(/notifications[\s\S]*?type\s+text[^)]*check\s*\(([^)]+)\)/i);
    expect(notifConstraint).toBeTruthy();
    expect(notifConstraint[1]).toContain("'program'");
  });

  it('notifications CHECK should not include payment', () => {
    const notifConstraint = schemaFile.match(/notifications[\s\S]*?type\s+text[^)]*check\s*\(([^)]+)\)/i);
    expect(notifConstraint).toBeTruthy();
    expect(notifConstraint[1]).not.toContain("'payment'");
  });

  it('notifications CHECK should have exactly 6 types matching TypeScript', () => {
    const notifConstraint = schemaFile.match(/notifications[\s\S]*?type\s+text[^)]*check\s*\(([^)]+)\)/i);
    expect(notifConstraint).toBeTruthy();
    const types = notifConstraint[1].match(/'([a-z]+)'/g).map(s => s.replace(/'/g, ''));
    expect(types).toHaveLength(6);
    expect(types).toEqual(expect.arrayContaining(['booking', 'event', 'partner', 'message', 'program', 'announcement']));
  });
});

// ─── Schema: notification_preferences no payments column ─
describe('Schema: notification_preferences cleaned', () => {
  it('notification_preferences should not have payments column', () => {
    const npSection = schemaFile.match(/notification_preferences[\s\S]*?\);/);
    expect(npSection).toBeTruthy();
    expect(npSection[0]).not.toContain('payments');
  });

  it('notification_preferences should have exactly 5 pref columns', () => {
    const npSection = schemaFile.match(/notification_preferences[\s\S]*?\);/);
    expect(npSection).toBeTruthy();
    const boolCols = npSection[0].match(/(\w+)\s+boolean\s+not\s+null/g);
    expect(boolCols).toHaveLength(5);
  });
});

// ─── Schema: payments/payment_entries tables removed ─────
describe('Schema: dead payments tables removed', () => {
  it('schema should not have payments table', () => {
    expect(schemaFile).not.toMatch(/create table.*payments\s*\(/i);
  });

  it('schema should not have payment_entries table', () => {
    expect(schemaFile).not.toContain('payment_entries');
  });

  it('no app code should reference payments/payment_entries tables', () => {
    const dbFile2 = readFileSync(join(__dirname, '..', 'app', 'dashboard', 'lib', 'db.ts'), 'utf-8');
    expect(dbFile2).not.toContain('fetchPayments');
    expect(dbFile2).not.toContain("from('payments')");
    expect(dbFile2).not.toContain("from('payment_entries')");
  });
});

// ─── No stale references in data.ts ────────────────────
describe('Dead Code: data.ts has no stale references', () => {
  it('data.ts should not reference in-use or reserved status', () => {
    expect(dataFile).not.toContain("'in-use'");
    expect(dataFile).not.toContain("'reserved'");
  });

  it('data.ts should not reference ball-machine type', () => {
    expect(dataFile).not.toContain("'ball-machine'");
  });

  it('data.ts should not have currentUser/endsAt/startsIn on courts', () => {
    expect(dataFile).not.toContain('currentUser:');
    expect(dataFile).not.toContain('endsAt:');
    expect(dataFile).not.toContain('startsIn:');
  });
});
