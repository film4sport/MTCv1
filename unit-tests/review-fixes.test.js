import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const storeFile = readFileSync(join(__dirname, '..', 'app', 'dashboard', 'lib', 'store.tsx'), 'utf-8');
const infoFile = readFileSync(join(__dirname, '..', 'app', 'info', 'page.tsx'), 'utf-8');
const membershipFile = readFileSync(join(__dirname, '..', 'app', 'info', 'components', 'MembershipTab.tsx'), 'utf-8');

// ─── removePartner has optimistic rollback ──────────────
describe('Store: removePartner rollback on failure', () => {
  it('removePartner should capture removed item before filtering', () => {
    const fnMatch = storeFile.match(/const removePartner[\s\S]*?\}, \[.*?\]\);/);
    expect(fnMatch).toBeTruthy();
    expect(fnMatch[0]).toContain('partners.find');
  });

  it('removePartner should restore on catch', () => {
    const fnMatch = storeFile.match(/const removePartner[\s\S]*?\}, \[.*?\]\);/);
    expect(fnMatch).toBeTruthy();
    // Should have rollback in the catch block
    expect(fnMatch[0]).toContain('if (removed)');
    expect(fnMatch[0]).toContain('setPartners(prev => [...prev, removed]');
  });

  it('removePartner should depend on partners array', () => {
    const fnMatch = storeFile.match(/const removePartner[\s\S]*?\}, \[([^\]]*)\]\);/);
    expect(fnMatch).toBeTruthy();
    expect(fnMatch[1]).toContain('partners');
  });

  it('removePartner should still show error toast', () => {
    const fnMatch = storeFile.match(/const removePartner[\s\S]*?\}, \[.*?\]\);/);
    expect(fnMatch).toBeTruthy();
    expect(fnMatch[0]).toContain("showToast('Failed to remove partner request.'");
  });
});

// ─── All mutations should have rollback pattern ─────────
describe('Store: all mutations follow rollback pattern', () => {
  const mutationsToCheck = [
    { name: 'addBooking', rollbackMarker: 'setBookings(prev =>' },
    { name: 'cancelBooking', rollbackMarker: 'setBookings(prev =>' },
    { name: 'addPartner', rollbackMarker: 'setPartners(prev =>' },
    { name: 'removePartner', rollbackMarker: 'setPartners(prev => [...prev, removed]' },
    { name: 'toggleRsvp', rollbackMarker: 'setEvents(snapshot)' },
    { name: 'sendMessage', rollbackMarker: 'setConversations(prev => prev.map(c =>' },
    { name: 'dismissAnnouncement', rollbackMarker: 'setAnnouncements(prev =>' },
  ];

  mutationsToCheck.forEach(({ name, rollbackMarker }) => {
    it(`${name} should have rollback logic in catch block`, () => {
      const fnMatch = storeFile.match(new RegExp(`const ${name}[\\s\\S]*?\\}, \\[.*?\\]\\);`));
      expect(fnMatch).toBeTruthy();
      expect(fnMatch[0]).toContain('.catch(');
      expect(fnMatch[0]).toContain(rollbackMarker);
    });
  });
});

// ─── Info page: no console.warn ─────────────────────────
describe('Info page: logging convention', () => {
  it('should not use console.warn', () => {
    expect(infoFile).not.toContain('console.warn');
  });

  it('should only use console.error for logging', () => {
    // All console.* calls should be console.error
    const consoleCalls = infoFile.match(/console\.\w+/g) || [];
    consoleCalls.forEach(call => {
      expect(call).toBe('console.error');
    });
  });
});

// ─── Info page: existingProfile type is correct ─────────
// (Now in MembershipTab.tsx after info page split)
describe('Info page: existingProfile type matches User shape', () => {
  it('existingProfile should not reference membershipType', () => {
    const stateDecl = membershipFile.match(/existingProfile.*useState/);
    expect(stateDecl).toBeTruthy();
    expect(stateDecl[0]).not.toContain('membershipType');
  });

  it('existingProfile should not reference joinedDate', () => {
    const stateDecl = membershipFile.match(/existingProfile.*useState/);
    expect(stateDecl).toBeTruthy();
    expect(stateDecl[0]).not.toContain('joinedDate');
  });

  it('member banner should not render membershipType (would be undefined)', () => {
    const bannerSection = membershipFile.match(/Existing Member Profile Banner[\s\S]*?<\/section>/);
    expect(bannerSection).toBeTruthy();
    expect(bannerSection[0]).not.toContain('existingProfile.membershipType');
  });

  it('member banner should show Active/Paused Member text', () => {
    const bannerSection = membershipFile.match(/Existing Member Profile Banner[\s\S]*?<\/section>/);
    expect(bannerSection).toBeTruthy();
    expect(bannerSection[0]).toContain("'Active'");
    expect(bannerSection[0]).toContain('Member');
  });

  it('existingProfile type should include optional status field', () => {
    const stateDecl = membershipFile.match(/existingProfile.*useState<([^>]+)>/);
    expect(stateDecl).toBeTruthy();
    expect(stateDecl[1]).toContain('status');
  });

  it('banner should handle paused status', () => {
    const bannerSection = membershipFile.match(/Existing Member Profile Banner[\s\S]*?<\/section>/);
    expect(bannerSection).toBeTruthy();
    expect(bannerSection[0]).toContain("status === 'paused'");
    expect(bannerSection[0]).toContain('Paused');
  });
});

// ─── No console.warn anywhere in app/ ───────────────────
describe('Global: no console.warn in app directory', () => {
  const appFiles = [
    'app/info/page.tsx',
    'app/login/page.tsx',
    'app/dashboard/lib/store.tsx',
    'app/dashboard/lib/db.ts',
  ];

  appFiles.forEach(filePath => {
    it(`${filePath} should not use console.warn`, () => {
      const content = readFileSync(join(__dirname, '..', filePath), 'utf-8');
      expect(content).not.toContain('console.warn');
    });
  });
});
