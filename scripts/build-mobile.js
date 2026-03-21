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
const siteContent = require('../app/lib/site-content.json');

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
  'splash.ts',
  'utils.ts',
  'config.ts',
  'event-delegation.ts',
  'api-client.ts',
  'auth.ts',
  'theme.ts',
  'navigation.ts',
  'partners.ts',
  'weather.ts',
  'booking.ts',
  'schedule.ts',
  'events.ts',
  'home-calendar.ts',
  'install-gate.ts',
  'interactive.ts',
  'mybookings.ts',
  'onboarding.ts',
  'events-registration.ts',
  'lessons.ts',
  'avatar.ts',
  'messaging.ts',
  'account.ts',
  'notifications.ts',
  'realtime-sync.ts',
  'pull-refresh.ts',
  'profile.ts',
  'confirm-modal.ts',
  'enhancements.ts',
  'app.ts',
];

// Lazy-loaded bundles (only fetched when user navigates to admin/captain screens)
const LAZY_BUNDLES = [
  { name: 'admin', js: ['admin-helpers.ts', 'admin-dashboard.ts', 'admin-members.ts', 'admin-courts.ts', 'admin-announcements.ts', 'admin-events.ts'], css: ['admin.css'] },
  { name: 'captain', js: ['captain.ts'], css: ['captain.css'] },
];

// ── Validate file lists against filesystem ──────────────────
const cssOnDisk = fs.readdirSync(path.join(MOBILE_DIR, 'css')).filter(f => f.endsWith('.css')).sort();
const jsOnDisk = fs.readdirSync(path.join(MOBILE_DIR, 'js')).filter(f => f.endsWith('.ts')).sort();

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
  loader: 'ts',
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
  const { code: lazyMinJs } = transformSync(lazyJs, { loader: 'ts', minify: true });
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
const templatePath = path.join(MOBILE_DIR, 'index.template.html');
const htmlPath = path.join(MOBILE_DIR, 'index.html');
let htmlContent = fs.readFileSync(templatePath, 'utf8');

// ── Stitch Components ───────────────────────────────────────
const COMPONENTS_DIR = path.join(MOBILE_DIR, 'components');
function stitchComponents(content) {
  const placeholderRegex = /<!-- \[\[COMPONENT:([^\]]+)\]\] -->/g;
  let match;
  let hasPlaceholders = false;
  let stitchedContent = content;
  
  // We need to do this in a way that handles nested placeholders
  while ((match = placeholderRegex.exec(content)) !== null) {
    hasPlaceholders = true;
    const name = match[1];
    const componentPath = path.join(COMPONENTS_DIR, `${name}.html`);
    if (fs.existsSync(componentPath)) {
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      stitchedContent = stitchedContent.replace(match[0], componentContent);
    } else {
      console.warn(`  ⚠ Component not found: ${name}`);
    }
  }
  
  if (hasPlaceholders) {
    return stitchComponents(stitchedContent);
  }
  return stitchedContent;
}

console.log('  Stitching components...');
htmlContent = stitchComponents(htmlContent);

// Update index.template.html cache-bust inline script (optional but good for consistency if we ever read it back)
// Actually we only care about the output index.html
htmlContent = htmlContent.replace(
  /name\.indexOf\('[^']+'\)/,
  `name.indexOf('${newCacheName}')`
);

// Update the template itself too so it's always "current" for the next read?
// No, the template should stay a template. The cache-bust script in the template
// should probably have a placeholder too if we want to be clean, 
// but it doesn't really matter as long as the output is correct.

htmlContent = htmlContent
  .replace(/MTC COURT - Mono Tennis Club/g, `MTC COURT - ${siteContent.clubName}`)
  .replace(/role="application" aria-label="Mono Tennis Club App"/g, `role="application" aria-label="${siteContent.clubName} App"`)
  .replace(/alt="Mono Tennis Club"/g, `alt="${siteContent.clubName}"`)
  .replace(/MONO TENNIS CLUB/g, siteContent.clubName.toUpperCase())
  .replace(/Mono Tennis Club/g, siteContent.clubName)
  .replace(/monotennisclub1@gmail\.com/g, siteContent.supportEmail)
  .replace(/monotennis\.payment@gmail\.com/g, siteContent.paymentEmail);
fs.writeFileSync(htmlPath, htmlContent);

// Update the cache-bust script in index.template.html as well?
// The current build script was doing:
// let htmlContent = fs.readFileSync(htmlPath, 'utf8');
// htmlContent = htmlContent.replace(/name\.indexOf\('[^']+'\)/, `name.indexOf('${newCacheName}')`);
// fs.writeFileSync(htmlPath, htmlContent);
// This was updating the source index.html.
// If we want to keep that behavior, we should update index.template.html.

let templateContent = fs.readFileSync(templatePath, 'utf8');
templateContent = templateContent.replace(
  /name\.indexOf\('[^']+'\)/,
  `name.indexOf('${newCacheName}')`
);
fs.writeFileSync(templatePath, templateContent);

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
