#!/usr/bin/env node
/**
 * Mobile PWA Build Pipeline
 * - Concatenates + minifies CSS/JS into two bundles
 * - Auto-bumps SW cache version from content hash (no manual version bumps needed)
 * - Validates file lists against filesystem (warns about unlisted files)
 * Run: node scripts/build-mobile.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { transformSync } = require('esbuild');

const MOBILE_DIR = path.join(__dirname, '..', 'public', 'mobile-app');
const DIST_DIR = path.join(MOBILE_DIR, 'dist');

// CSS files in load order (must match original index.html cascade)
// NOTE: admin.css and captain.css are split into separate lazy-loaded bundles
const CSS_FILES = [
  'variables.css',
  'splash.css',
  'base.css',
  'login.css',
  'layout.css',
  'home.css',
  'booking.css',
  'navigation.css',
  'menu-notifications.css',
  'social.css',
  'search.css',
  'profile.css',
  'messaging.css',
  'events.css',
  'partners.css',
  'schedule.css',
  'events-screen.css',
  'screens.css',
  'modals.css',
  'enhancements.css',
  'neumorphic.css',
  'chat.css',
  'tablet.css',
];

// JS files in load order (must match original index.html dependency chain)
// NOTE: admin.js and captain.js are split into separate lazy-loaded bundles
const JS_FILES = [
  'splash.js',
  'utils.js',
  'config.js',
  'event-delegation.js',
  'api-client.js',
  'auth.js',
  'theme.js',
  'navigation.js',
  'partners.js',
  'weather.js',
  'booking.js',
  'schedule.js',
  'events.js',
  'home-calendar.js',
  'install-gate.js',
  'interactive.js',
  'mybookings.js',
  'onboarding.js',
  'events-registration.js',
  'lessons.js',
  'avatar.js',
  'messaging.js',
  'account.js',
  'notifications.js',
  'realtime-sync.js',
  'pull-refresh.js',
  'profile.js',
  'confirm-modal.js',
  'enhancements.js',
  'app.js',
];

// Lazy-loaded bundles (only fetched when user navigates to admin/captain screens)
const LAZY_BUNDLES = [
  { name: 'admin', js: ['admin-helpers.js', 'admin-dashboard.js', 'admin-members.js', 'admin-courts.js', 'admin-announcements.js', 'admin-events.js'], css: ['admin.css'] },
  { name: 'captain', js: ['captain.js'], css: ['captain.css'] },
];

// ── Validate file lists against filesystem ──────────────────
const cssOnDisk = fs.readdirSync(path.join(MOBILE_DIR, 'css')).filter(f => f.endsWith('.css')).sort();
const jsOnDisk = fs.readdirSync(path.join(MOBILE_DIR, 'js')).filter(f => f.endsWith('.js')).sort();

const lazyCssFiles = LAZY_BUNDLES.flatMap(b => b.css);
const lazyJsFiles = LAZY_BUNDLES.flatMap(b => b.js);
const unlistedCss = cssOnDisk.filter(f => !CSS_FILES.includes(f) && !lazyCssFiles.includes(f));
const unlistedJs = jsOnDisk.filter(f => !JS_FILES.includes(f) && !lazyJsFiles.includes(f));
const missingCss = CSS_FILES.filter(f => !cssOnDisk.includes(f));
const missingJs = JS_FILES.filter(f => !jsOnDisk.includes(f));

if (missingCss.length) { console.error(`ERROR: Listed CSS files not found: ${missingCss.join(', ')}`); process.exit(1); }
if (missingJs.length) { console.error(`ERROR: Listed JS files not found: ${missingJs.join(', ')}`); process.exit(1); }
if (unlistedCss.length) console.warn(`  ⚠ CSS files on disk not in bundle: ${unlistedCss.join(', ')}`);
if (unlistedJs.length) console.warn(`  ⚠ JS files on disk not in bundle: ${unlistedJs.join(', ')}`);

// ── Ensure dist directory exists ────────────────────────────
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// ── CSS Bundle ──────────────────────────────────────────────
const cssContent = CSS_FILES.map((f) => {
  const filePath = path.join(MOBILE_DIR, 'css', f);
  return `/* === ${f} === */\n` + fs.readFileSync(filePath, 'utf8');
}).join('\n');

const { code: minifiedCss } = transformSync(cssContent, {
  loader: 'css',
  minify: true,
});

fs.writeFileSync(path.join(DIST_DIR, 'app.bundle.css'), minifiedCss);

// ── JS Bundle ───────────────────────────────────────────────
const jsContent = JS_FILES.map((f) => {
  const filePath = path.join(MOBILE_DIR, 'js', f);
  return `// === ${f} ===\n` + fs.readFileSync(filePath, 'utf8');
}).join('\n;\n');

const { code: minifiedJs } = transformSync(jsContent, {
  loader: 'js',
  minify: true,
});

fs.writeFileSync(path.join(DIST_DIR, 'app.bundle.js'), minifiedJs);

// ── Lazy Bundles (admin, captain) ────────────────────────────
const lazyReport = [];
for (const bundle of LAZY_BUNDLES) {
  // CSS
  const lazyCss = bundle.css.map(f => {
    return `/* === ${f} === */\n` + fs.readFileSync(path.join(MOBILE_DIR, 'css', f), 'utf8');
  }).join('\n');
  const { code: lazyMinCss } = transformSync(lazyCss, { loader: 'css', minify: true });
  fs.writeFileSync(path.join(DIST_DIR, `${bundle.name}.bundle.css`), lazyMinCss);

  // JS
  const lazyJs = bundle.js.map(f => {
    return `// === ${f} ===\n` + fs.readFileSync(path.join(MOBILE_DIR, 'js', f), 'utf8');
  }).join('\n;\n');
  const { code: lazyMinJs } = transformSync(lazyJs, { loader: 'js', minify: true });
  fs.writeFileSync(path.join(DIST_DIR, `${bundle.name}.bundle.js`), lazyMinJs);

  const cssKB = (Buffer.byteLength(lazyMinCss) / 1024).toFixed(1);
  const jsKB = (Buffer.byteLength(lazyMinJs) / 1024).toFixed(1);
  lazyReport.push(`  Lazy [${bundle.name}]: CSS ${cssKB}KB, JS ${jsKB}KB`);
}

// ── Auto-bump SW cache version from content hash ────────────
const bundleHash = crypto.createHash('md5')
  .update(minifiedCss)
  .update(minifiedJs)
  .digest('hex')
  .slice(0, 8);

const newCacheName = `mtc-court-${bundleHash}`;

// Update sw.js CACHE_NAME + console logs
const swPath = path.join(MOBILE_DIR, 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');
swContent = swContent.replace(
  /const CACHE_NAME = '[^']+';/,
  `const CACHE_NAME = '${newCacheName}';`
);
swContent = swContent.replace(
  /Installing [^.]+\.\.\./,
  `Installing ${newCacheName}...`
);
swContent = swContent.replace(
  /Activating [^.]+\.\.\./,
  `Activating ${newCacheName}...`
);
fs.writeFileSync(swPath, swContent);

// Update index.html cache-bust inline script
const htmlPath = path.join(MOBILE_DIR, 'index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');
htmlContent = htmlContent.replace(
  /name\.indexOf\('[^']+'\)/,
  `name.indexOf('${newCacheName}')`
);
fs.writeFileSync(htmlPath, htmlContent);

// ── Report ──────────────────────────────────────────────────
const cssOrigKB = (Buffer.byteLength(cssContent) / 1024).toFixed(1);
const cssBundleKB = (Buffer.byteLength(minifiedCss) / 1024).toFixed(1);
const jsOrigKB = (Buffer.byteLength(jsContent) / 1024).toFixed(1);
const jsBundleKB = (Buffer.byteLength(minifiedJs) / 1024).toFixed(1);

console.log('Mobile PWA build complete:');
console.log(`  CSS: ${CSS_FILES.length} files → dist/app.bundle.css (${cssOrigKB}KB → ${cssBundleKB}KB)`);
console.log(`  JS:  ${JS_FILES.length} files → dist/app.bundle.js (${jsOrigKB}KB → ${jsBundleKB}KB)`);
lazyReport.forEach(line => console.log(line));
console.log(`  HTTP requests: ${CSS_FILES.length + JS_FILES.length} → 2 (+ ${LAZY_BUNDLES.length} lazy)`);
console.log(`  Cache: ${newCacheName} (auto-generated from content hash)`);
