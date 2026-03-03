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
const CSS_FILES = [
  'variables.css',
  'base.css',
  'login.css',
  'layout.css',
  'home.css',
  'booking.css',
  'navigation.css',
  'social.css',
  'admin.css',
  'payments.css',
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
];

// JS files in load order (must match original index.html dependency chain)
const JS_FILES = [
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
  'interactive.js',
  'payments.js',
  'mybookings.js',
  'onboarding.js',
  'events-registration.js',
  'avatar.js',
  'messaging.js',
  'account.js',
  'notifications.js',
  'pull-refresh.js',
  'profile.js',
  'admin.js',
  'confirm-modal.js',
  'enhancements.js',
  'app.js',
];

// ── Validate file lists against filesystem ──────────────────
const cssOnDisk = fs.readdirSync(path.join(MOBILE_DIR, 'css')).filter(f => f.endsWith('.css')).sort();
const jsOnDisk = fs.readdirSync(path.join(MOBILE_DIR, 'js')).filter(f => f.endsWith('.js')).sort();

const unlistedCss = cssOnDisk.filter(f => !CSS_FILES.includes(f));
const unlistedJs = jsOnDisk.filter(f => !JS_FILES.includes(f));
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
console.log(`  HTTP requests: ${CSS_FILES.length + JS_FILES.length} → 2`);
console.log(`  Cache: ${newCacheName} (auto-generated from content hash)`);
