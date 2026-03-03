#!/bin/bash
# ============================================================
# MTC Supabase Database Backup (Free Tier DIY)
# ============================================================
# Creates a timestamped pg_dump of the Supabase database.
# Works with the free tier — no Pro plan needed.
#
# SETUP (one-time):
#   1. Get your DB connection string from Supabase Dashboard:
#      Project Settings → Database → Connection string → URI
#   2. Add to .env.local:
#      DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
#   3. Install PostgreSQL client tools:
#      macOS:   brew install libpq && brew link --force libpq
#      Ubuntu:  sudo apt-get install postgresql-client
#      Windows: Install PostgreSQL and add bin/ to PATH
#
# USAGE:
#   npm run db:backup                    # manual backup
#   npm run db:backup -- --data-only     # data only (no schema)
#   npm run db:backup -- --schema-only   # schema only (no data)
#
# AUTOMATED (cron):
#   # Weekly backup every Sunday at 2 AM:
#   0 2 * * 0 cd /path/to/MTCv1 && npm run db:backup >> backups/cron.log 2>&1
#
#   # Daily backup at midnight:
#   0 0 * * * cd /path/to/MTCv1 && npm run db:backup >> backups/cron.log 2>&1
#
# RESTORE:
#   psql "$DATABASE_URL" < backups/mtc-backup-2026-03-03T120000.sql
# ============================================================

set -euo pipefail

# ── Load environment ─────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Source .env.local for DATABASE_URL
if [ -f "$PROJECT_DIR/.env.local" ]; then
  # Only export DATABASE_URL, ignore other vars
  DATABASE_URL=$(grep -E '^DATABASE_URL=' "$PROJECT_DIR/.env.local" | cut -d= -f2-)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL not set."
  echo ""
  echo "Add your Supabase connection string to .env.local:"
  echo "  DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
  echo ""
  echo "Find it in: Supabase Dashboard → Project Settings → Database → Connection string → URI"
  exit 1
fi

# ── Verify pg_dump is available ──────────────────────────
if ! command -v pg_dump &> /dev/null; then
  echo "ERROR: pg_dump not found. Install PostgreSQL client tools:"
  echo "  macOS:   brew install libpq && brew link --force libpq"
  echo "  Ubuntu:  sudo apt-get install postgresql-client"
  exit 1
fi

# ── Create backups directory ─────────────────────────────
BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"

# ── Generate filename ────────────────────────────────────
TIMESTAMP=$(date +"%Y-%m-%dT%H%M%S")
FILENAME="mtc-backup-${TIMESTAMP}.sql"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

# ── Parse extra flags ────────────────────────────────────
EXTRA_FLAGS=""
for arg in "$@"; do
  case "$arg" in
    --data-only)   EXTRA_FLAGS="--data-only" ;;
    --schema-only) EXTRA_FLAGS="--schema-only" ;;
  esac
done

# ── Run pg_dump ──────────────────────────────────────────
echo "Starting backup..."
echo "  Target: ${FILEPATH}"

pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --schema=public \
  --format=plain \
  $EXTRA_FLAGS \
  > "$FILEPATH"

# ── Compress (gzip) ─────────────────────────────────────
gzip "$FILEPATH"
FINAL="${FILEPATH}.gz"
SIZE=$(du -h "$FINAL" | cut -f1)

echo "Backup complete!"
echo "  File: ${FINAL}"
echo "  Size: ${SIZE}"

# ── Prune old backups (keep last 30) ────────────────────
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/mtc-backup-*.sql.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 30 ]; then
  PRUNE_COUNT=$((BACKUP_COUNT - 30))
  echo "  Pruning ${PRUNE_COUNT} old backup(s) (keeping last 30)..."
  ls -1t "$BACKUP_DIR"/mtc-backup-*.sql.gz | tail -n "$PRUNE_COUNT" | xargs rm -f
fi

echo "Done."
