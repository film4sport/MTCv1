# Launch Smoke Matrix

This repo keeps a single trimmed launch-smoke entrypoint at `node tmp/manual-smoke.js`.

## What It Covers

- Mobile PWA admin dashboard overview shape
- Mobile PWA admin court-block modal presence
- Mobile PWA admin member search
- Mobile PWA messages member search
- Mobile PWA home calendar future-only rendering
- Mobile PWA schedule calendar future-only rendering
- Mobile PWA fake past schedule content regression
- Mobile PWA booking participant search
- iPhone 6 booking calendar layout
- Desktop PWA schedule calendar future-only rendering
- Desktop PWA events calendar future-only rendering
- Desktop PWA messages member search
- Desktop PWA booking participant search
- Desktop PWA admin member search

## Trim Rules

- Cover one happy-path check per critical capability.
- Prefer shared-data regressions over page-specific micro-states.
- Avoid duplicate checks across surfaces unless the UI stack is different.
- Keep the suite focused on launch-critical flows, not exhaustive behavior.
- If a check becomes flaky or low-value, simplify or remove it instead of piling on retries.

## Maintenance

- Real logic lives in `scripts/smoke/launch-smoke.js`.
- `tmp/manual-smoke.js` stays as the stable wrapper so existing approvals and habits keep working.
- When new features ship, add smoke coverage only if the feature is launch-critical or has already regressed once.
