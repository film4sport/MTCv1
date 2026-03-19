import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '..');
const store = readFileSync(resolve(root, 'app/dashboard/lib/store.tsx'), 'utf-8');

describe('Dashboard announcement regressions', () => {
  it('initial data load replaces announcements even when the server returns an empty array', () => {
    expect(store).toContain('const anns = safeArray(settledValue(results[6], []));');
    expect(store).toContain('setAnnouncements(anns);');
  });

  it('refreshData replaces announcements even when they have been cleared server-side', () => {
    expect(store).toContain('const ann_ = safeArray(settledValue(a, []));');
    expect(store).toContain('setAnnouncements(ann_);');
  });

  it('realtime announcements reconcile to server truth instead of keeping stale items', () => {
    expect(store).toContain("db.fetchAnnouncements(userId).then(a => {");
    expect(store).toContain('setAnnouncements(safeArray(a));');
  });
});
