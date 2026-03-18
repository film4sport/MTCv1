/**
 * messaging-features.test.js — Unit tests for messaging features added Mar 9, 2026
 * Covers: welcome message guards, auth callback 24h guard, welcome cleanup RPC,
 *         cleanup API endpoint, admin pinning in search, admin name override
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// ─── Source file helpers ──────────────────────────────────
const readSource = (filePath) => readFileSync(path.resolve(filePath), 'utf8');

const messagesPageSrc = readSource('app/dashboard/messages/page.tsx');
// authCallbackSrc removed — auth/callback deleted in PIN auth refactor
const convRouteSrc = readSource('app/api/mobile/conversations/route.ts');
const schemaSQL = readSource('supabase/schema.sql');
const welcomeGuardsMigration = readSource('supabase/migrations/20260309_fix_welcome_message_guards.sql');
const cleanupMigration = readSource('supabase/migrations/20260309_cleanup_stale_welcomes_rpc.sql');
const mobileMessagingSrc = readSource('public/mobile-app/js/messaging.js');
const dbSrc = readSource('app/dashboard/lib/db.ts');

// ─── Welcome Message Guards (RPC) ────────────────────────
describe('Welcome Message Guards — send_welcome_message RPC', () => {
  it('skips admin self-welcome', () => {
    expect(schemaSQL).toContain('if v_admin_id = new_user_id then return; end if;');
    expect(welcomeGuardsMigration).toContain('if v_admin_id = new_user_id then return; end if;');
  });

  it('has idempotency guard (checks if welcome already sent)', () => {
    expect(schemaSQL).toContain("perform 1 from public.messages where id = 'welcome-' || new_user_id::text");
    expect(schemaSQL).toContain('if found then return; end if;');
  });

  it('reuses existing conversation (dedup)', () => {
    expect(schemaSQL).toContain('select id into v_conv_id from public.conversations');
    expect(schemaSQL).toContain('if v_conv_id is null then');
  });

  it('updated welcome message does NOT mention gate code', () => {
    expect(welcomeGuardsMigration).not.toContain('gate code');
    expect(welcomeGuardsMigration).toContain('Explore the app');
  });

  it('message ID format is welcome-{userId}', () => {
    expect(schemaSQL).toContain("'welcome-' || new_user_id::text");
  });

  it('from_name is always "Mono Tennis Club"', () => {
    expect(schemaSQL).toContain("'Mono Tennis Club'");
  });
});

// Auth Callback tests removed — auth/callback deleted in PIN auth refactor

// ─── Welcome Cleanup RPC ─────────────────────────────────
describe('Cleanup Stale Welcomes RPC', () => {
  it('function exists in schema.sql', () => {
    expect(schemaSQL).toContain('cleanup_stale_welcomes');
  });

  it('migration file exists with correct SQL', () => {
    expect(cleanupMigration).toContain('create or replace function cleanup_stale_welcomes');
    expect(cleanupMigration).toContain('older_than_days integer default 7');
  });

  it('deletes only conversations with exactly 1 welcome message', () => {
    expect(cleanupMigration).toContain('count(*) from public.messages m where m.conversation_id = c.id) = 1');
    expect(cleanupMigration).toContain("m.id like 'welcome-%'");
  });

  it('respects the age threshold', () => {
    expect(cleanupMigration).toContain("older_than_days || ' days'");
  });

  it('returns count of deleted conversations', () => {
    expect(cleanupMigration).toContain('return v_deleted');
  });

  it('cascades: deletes messages before conversation', () => {
    expect(cleanupMigration).toContain('delete from public.messages where conversation_id = v_conv.id');
    expect(cleanupMigration).toContain('delete from public.conversations where id = v_conv.id');
  });
});

// ─── Cleanup API Endpoint ────────────────────────────────
describe('Cleanup API — DELETE /api/mobile/conversations', () => {
  it('handles action: cleanup-welcomes', () => {
    expect(convRouteSrc).toContain("action === 'cleanup-welcomes'");
  });

  it('requires admin role', () => {
    expect(convRouteSrc).toContain("authResult.role !== 'admin'");
  });

  it('calls the cleanup_stale_welcomes RPC', () => {
    expect(convRouteSrc).toContain("supabase.rpc('cleanup_stale_welcomes'");
  });

  it('clamps days between 1 and 90', () => {
    expect(convRouteSrc).toContain('Math.max(1, Math.min(90,');
  });

  it('returns deleted count', () => {
    expect(convRouteSrc).toContain("deleted: data || 0");
  });
});

// ─── Admin Pinned in Member Search (Dashboard) ───────────
describe('Admin Pinned in Member Search — Dashboard', () => {
  it('sorts admins to top of member list', () => {
    expect(messagesPageSrc).toContain("a.role === 'admin' && b.role !== 'admin'");
  });

  it('matches "mono tennis club" in search query', () => {
    expect(messagesPageSrc).toContain("'mono tennis club'.includes(searchQuery.toLowerCase())");
  });

  it('displays admin as "Mono Tennis Club" in search results', () => {
    expect(messagesPageSrc).toContain("m.role === 'admin' ? 'Mono Tennis Club' : m.name");
  });

  it('shows verified badge for admin in search', () => {
    expect(messagesPageSrc).toContain("m.role === 'admin' && <svg");
  });
});

// ─── Admin Pinned in Member Search (Mobile PWA) ──────────
describe('Admin Pinned in Member Search — Mobile PWA', () => {
  it('sortMembersAdminFirst sorts admins to top', () => {
    expect(mobileMessagingSrc).toContain('function sortMembersAdminFirst');
    expect(mobileMessagingSrc).toContain("a.role === 'admin'");
  });

  it('renderMemberItem shows admin as "Mono Tennis Club"', () => {
    expect(mobileMessagingSrc).toContain("member.role === 'admin' ? 'Mono Tennis Club' : member.name");
  });

  it('shows "Club Admin" skill for admin', () => {
    expect(mobileMessagingSrc).toContain("member.role === 'admin' ? 'Club Admin' : member.skill");
  });

  it('shows verified badge SVG for admin', () => {
    expect(mobileMessagingSrc).toContain("member.role === 'admin'");
    expect(mobileMessagingSrc).toContain('M9 12l2 2 4-4m5.618');
  });

  it('searchMembers matches "mono tennis club" query for admin', () => {
    expect(mobileMessagingSrc).toContain("'mono tennis club'.includes(query)");
  });

  it('showAllMembers uses sortMembersAdminFirst', () => {
    expect(mobileMessagingSrc).toContain('sortMembersAdminFirst(MTC.state.clubMembers');
  });
});

// ─── Admin Name Override in Conversations ────────────────
describe('Admin Name Override in Conversations', () => {
  it('Dashboard db.ts overrides admin name to "Mono Tennis Club"', () => {
    expect(dbSrc).toContain("memberName = 'Mono Tennis Club'");
    expect(dbSrc).toContain('adminIds.has(otherMemberId)');
  });

  it('Mobile PWA renderConversationsList overrides admin name', () => {
    expect(mobileMessagingSrc).toContain("member.role === 'admin'");
    expect(mobileMessagingSrc).toContain("'Mono Tennis Club'");
  });
});
