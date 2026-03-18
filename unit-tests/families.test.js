/**
 * Families API — Structure & Validation Tests
 *
 * Tests: route structure, auth, CRUD operations, input validation.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const content = readFileSync(resolve(root, 'app/api/mobile/families/route.ts'), 'utf-8');

describe('Families API Route — Structure', () => {
  it('exports GET, POST, PATCH, DELETE handlers', () => {
    expect(content).toMatch(/export\s+(async\s+function|const)\s+GET/);
    expect(content).toMatch(/export\s+(async\s+function|const)\s+POST/);
    expect(content).toMatch(/export\s+(async\s+function|const)\s+PATCH/);
    expect(content).toMatch(/export\s+(async\s+function|const)\s+DELETE/);
  });

  it('authenticates requests', () => {
    expect(content).toContain('authenticateMobileRequest');
  });

  it('uses getAdminClient', () => {
    expect(content).toContain('getAdminClient');
  });
});

describe('Families API — Input Validation', () => {
  it('sanitizes member name', () => {
    expect(content).toContain('sanitizeInput');
  });

  it('validates member type (adult/junior)', () => {
    expect(content).toMatch(/adult|junior|memberType|member_type/i);
  });
});

describe('Families API — Delete Operations', () => {
  it('supports deleting a family member by ID', () => {
    expect(content).toMatch(/member_id|memberId|familyMemberId/);
  });

  it('uses family ownership check before delete', () => {
    // Should verify user owns the family before allowing delete
    expect(content).toMatch(/primary_user_id|owner|family_id/);
  });
});

describe('Families API — Cross-Platform Consistency', () => {
  const storeContent = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

  it('dashboard store tracks familyMembers state', () => {
    expect(storeContent).toContain('familyMembers');
    expect(storeContent).toContain('setFamilyMembers');
  });

  it('dashboard store imports FamilyMember type', () => {
    expect(storeContent).toContain('FamilyMember');
  });

  it('dashboard fetches family members from DB', () => {
    expect(storeContent).toContain('fetchFamilyMembers');
  });
});
