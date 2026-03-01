# MEMORY.md - Persistent Context for Claude Code

## Workflow Tools
- **Cowork (Claude Desktop)** is available for interactive browser-based visual verification. Use Cowork for subjective visual checks ("does this look right?", hover states, animations, glass morphism rendering, full-page scrollthroughs). Use Claude Code + Playwright for automated regression checks ("did this break?").
- **Code review report**: `MTC-Code-Review-Report.docx` in project root contains full codebase audit (38 findings). Refer to it for prioritized bug fixes and security hardening.

## Current Status
- **SMTP/Supabase email signups**: Not started yet. See report Phase 2 for implementation plan.
- **Priority before SMTP**: Security hardening (auth guard race condition, double-booking DB constraint, remove demo creds from client, fix offline auth bypass).

## Decisions Made
- (none yet - add decisions here as they are made)
