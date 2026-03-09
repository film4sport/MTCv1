/**
 * messaging-features.test.js — Unit tests for messaging features added Mar 9, 2026
 * Covers: admin filter tabs, welcome cleanup, admin pinning in search,
 *         welcome message guards, auth callback 24h guard
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// ─── Source file helpers ──────────────────────────────────
const readSource = (filePath) => readFileSync(path.resolve(filePath), 'utf8');

const messagesPageSrc = readSource('app/dashboard/messages/page.tsx');
const authCallbackSrc = readSource('app/auth/callback/route.ts');
const convRouteSrc = readSource('app/api/mobile/conversations/route.ts');
const schemaSQL = readSource('supabase/schema.sql');
const welcomeGuardsMigration = readSource('supabase/migrations/20260309_fix_welcome_message_guards.sql');
const cleanupMigration = readSource('supabase/migrations/20260309_cleanup_stale_welcomes_rpc.sql');
const mobileMessagingSrc = readSource('public/mobile-app/js/messaging.js');
const mobileNavigationSrc = readSource('public/mobile-app/js/navigation.js');
const mobileIndexHtml = readSource('public/mobile-app/index.html');
const dbSrc = readSource('app/dashboard/lib/db.ts');

// ─── Admin Message Filter Tabs (Dashboard) ───────────────
describe('Admin Message Filter Tabs — Dashboard', () => {
  it('has convoFilter state with three options', () => {
    expect(messagesPageSrc).toContain("useState<'all' | 'needs-reply' | 'welcome'>('all')");
  });

  it('filters conversations by "needs-reply" — last message not from current user', () => {
    expect(messagesPageSrc).toContain('lastMsg.fromId !== currentUser?.id');
  });

  it('filters conversations by "welcome" — single welcome-only message', () => {
    expect(messagesPageSrc).toContain("c.messages.length === 1 && c.messages[0].id.startsWith('welcome-')");
  });

  it('shows filter tabs only for admin users', () => {
    expect(messagesPageSrc).toContain("isAdmin && conversations.length > 0");
  });

  it('computes isAdmin from currentUser role', () => {
    expect(messagesPageSrc).toContain("currentUser?.role === 'admin'");
  });

  it('renders three filter tab buttons', () => {
    expect(messagesPageSrc).toContain("'all', 'All'");
    expect(messagesPageSrc).toContain("'needs-reply', 'Needs Reply'");
    expect(messagesPageSrc).toContain("'welcome', 'Welcome'");
  });

  it('displays filter counts on each tab', () => {
    // All: conversations.length, needs-reply: filtered count, welcome: filtered count
    expect(messagesPageSrc).toContain('count > 0');
  });

  it('has context-aware empty states for each filter', () => {
    expect(messagesPageSrc).toContain('All caught up!');
    expect(messagesPageSrc).toContain('No welcome-only conversations');
    expect(messagesPageSrc).toContain('All members have been personally messaged');
  });

  it('uses filteredConversations (not raw conversations) for rendering', () => {
    expect(messagesPageSrc).toContain('[...filteredConversations]');
    expect(messagesPageSrc).toContain('filteredConversations.length === 0');
  });
});

// ─── Admin Message Filter Tabs (Mobile PWA) ──────────────
describe('Admin Message Filter Tabs — Mobile PWA', () => {
  it('has filter tabs HTML in index.html', () => {
    expect(mobileIndexHtml).toContain('id="msgFilterTabs"');
    expect(mobileIndexHtml).toContain('data-filter="all"');
    expect(mobileIndexHtml).toContain('data-filter="needs-reply"');
    expect(mobileIndexHtml).toContain('data-filter="welcome"');
  });

  it('has setMsgFilter function', () => {
    expect(mobileMessagingSrc).toContain('window.setMsgFilter = function(filter)');
  });

  it('has initMsgFilterTabs function that checks for admin role', () => {
    expect(mobileMessagingSrc).toContain('window.initMsgFilterTabs = function()');
    expect(mobileMessagingSrc).toContain("user.role === 'admin'");
  });

  it('filter tabs hidden by default (display:none)', () => {
    expect(mobileIndexHtml).toContain('id="msgFilterTabs" style="display:none"');
  });

  it('initMsgFilterTabs called when navigating to messages', () => {
    expect(mobileNavigationSrc).toContain("initMsgFilterTabs");
  });

  it('filterKeysByMsgFilter filters welcome-only conversations', () => {
    expect(mobileMessagingSrc).toContain("indexOf('welcome-') === 0");
  });

  it('has context-aware empty states', () => {
    expect(mobileMessagingSrc).toContain('ALL CAUGHT UP');
    expect(mobileMessagingSrc).toContain('NO WELCOME-ONLY CHATS');
  });

  it('updateFilterCounts updates tab counts', () => {
    expect(mobileMessagingSrc).toContain('function updateFilterCounts()');
    expect(mobileMessagingSrc).toContain('filter-count');
  });
});

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
    // The old message had "Your court gate code will be provided after Opening Day"
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

// ─── Auth Callback 24h Guard ─────────────────────────────
describe('Auth Callback — Welcome Guard', () => {
  it('uses 24-hour window (not 5 minutes)', () => {
    expect(authCallbackSrc).toContain('24 * 60 * 60 * 1000');
    expect(authCallbackSrc).not.toContain('5 * 60 * 1000');
  });

  it('has secondary guard checking welcome-{userId} message', () => {
    expect(authCallbackSrc).toContain('existingWelcome');
    expect(authCallbackSrc).toContain("`welcome-${user.id}`");
  });

  it('waits for profile to exist before sending welcome', () => {
    expect(authCallbackSrc).toContain('profileReady');
    expect(authCallbackSrc).toContain('attempt < 10');
  });

  it('skips recovery type (not for new signups)', () => {
    expect(authCallbackSrc).toContain("type !== 'recovery'");
  });

  it('uses service role client for server-side operations', () => {
    expect(authCallbackSrc).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });
});

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

// ─── Dashboard Cleanup Button ────────────────────────────
describe('Dashboard Cleanup Button', () => {
  it('has cleanup button in filter tabs area', () => {
    expect(messagesPageSrc).toContain('handleCleanupWelcomes');
    expect(messagesPageSrc).toContain('Cleanup 7d+');
  });

  it('button only shows when welcome conversations exist', () => {
    expect(messagesPageSrc).toContain("conversations.some(c => c.messages.length === 1 && c.messages[0].id.startsWith('welcome-'))");
  });

  it('has loading state', () => {
    expect(messagesPageSrc).toContain('cleaningUp');
    expect(messagesPageSrc).toContain('Cleaning...');
  });

  it('sends correct API request', () => {
    expect(messagesPageSrc).toContain("action: 'cleanup-welcomes'");
    expect(messagesPageSrc).toContain('olderThanDays: 7');
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
    // Shield SVG icon for admin
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
    // The badge SVG with shield path
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
