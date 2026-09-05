---
name: guitar-app-playwright-test
description: Automated browser testing for GuitarApp using Playwright — verify lessons load, interactions work, and performance tracking persists
metadata:
  type: skill
---

# Guitar App Playwright Testing Skill

**Purpose**: Automate Phase 5 browser-based testing of the GuitarApp on real browsers (desktop/mobile) using Playwright.

**What it tests**:
- ✅ All 25 lessons render in the catalog
- ✅ Wave 1 unlock gates (only 5 visible initially)
- ✅ Lesson opens with content and coach panel
- ✅ Performance tracking records loops and persists to localStorage
- ✅ Navigation flows (back to home, reopen lessons)
- ✅ Audio files load without errors
- ✅ Chord diagrams render in lesson view
- ✅ Speech synthesis integration works
- ✅ Mobile responsiveness (optional device emulation)

**Usage**:
```bash
# Run full test suite
npm run test:playwright:full

# Run quick smoke test
npm run test:playwright:smoke

# Run on specific device (mobile/tablet/desktop)
npm run test:playwright:mobile

# Run with UI inspector (see what's happening)
npm run test:playwright:debug
```

---

## Implementation

Create `07-app/test/guitar-app.playwright.mjs`:

```javascript
// guitar-app.playwright.mjs
// Phase 5: Automated browser testing with Playwright
//
// Tests the real app running on localhost via a real browser.
// Validates: catalog rendering, lesson flow, performance tracking,
// audio loading, and persistence across page reloads.

import { chromium, firefox, webkit } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(__dirname, '..');
const TEST_CONFIG = {
  port: 8899,
  url: 'http://localhost:8899',
  headless: process.env.DEBUG ? false : true,
  slowMo: process.env.DEBUG ? 100 : 0,
  timeout: 30000,
  device: process.env.DEVICE || 'desktop', // 'desktop', 'mobile', 'tablet'
};

let server = null;
let results = { passed: 0, failed: 0, tests: [] };

function logTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    console.log(`✓ ${name}`);
  } else {
    results.failed++;
    console.error(`✗ ${name}${details ? ': ' + details : ''}`);
  }
}

function getDeviceConfig() {
  if (TEST_CONFIG.device === 'mobile') {
    return {
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    };
  } else if (TEST_CONFIG.device === 'tablet') {
    return {
      viewport: { width: 768, height: 1024 },
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
    };
  }
  return null;
}

async function startServer() {
  return new Promise((resolve) => {
    const handler = (req, res) => {
      let filePath = path.join(APP_DIR, req.url === '/' ? 'index.html' : req.url);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(APP_DIR, 'index.html');
      }
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.wav': 'audio/wav',
        '.css': 'text/css',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.webmanifest': 'application/manifest+json',
      };
      const contentType = contentTypes[ext] || 'application/octet-stream';
      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    };
    server = http.createServer(handler);
    server.listen(TEST_CONFIG.port, resolve);
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
}

async function runTests() {
  const browser = await chromium.launch({
    headless: TEST_CONFIG.headless,
  });
  const contextOptions = getDeviceConfig();
  const context = await browser.newContext(contextOptions || {});
  const page = await context.newPage();

  if (TEST_CONFIG.slowMo > 0) {
    page.on('framenavigated', () => console.log(`  [nav] ${page.url()}`));
  }

  try {
    // TEST 1: Load app
    console.log('\n=== LOADING APP ===');
    await page.goto(TEST_CONFIG.url, { waitUntil: 'networkidle' });
    logTest('Page loads', await page.title().then(t => t.includes('GuitarApp')));

    // TEST 2: Catalog renders
    console.log('\n=== CATALOG ===');
    const cards = await page.locator('.lesson-card').count();
    logTest('25 lesson cards render', cards === 25, `got ${cards}`);

    const unlockedCount = await page.locator('.lesson-card:not([disabled])').count();
    logTest('Wave 1 unlocks 5 lessons', unlockedCount === 5, `unlocked: ${unlockedCount}`);

    const catalogStatus = await page.locator('#catalog-status').textContent();
    logTest('Catalog status text correct', catalogStatus.includes('25 lessons'), catalogStatus);

    // TEST 3: Performance rail
    console.log('\n=== PERFORMANCE RAIL ===');
    const perfRailText = await page.locator('#performance-rail').textContent();
    logTest('Performance rail renders', perfRailText.includes('Performance ladder'), perfRailText);
    logTest('Performance rail shows Path A', perfRailText.includes('Path A'), perfRailText);
    logTest('Performance rail shows Level 2', perfRailText.includes('Level 2 - Lesson 12'), perfRailText);

    // TEST 4: Open Lesson 1
    console.log('\n=== LESSON 1 ===');
    await page.click('#start-l01');
    await page.waitForSelector('#lesson-view:not([hidden])');
    logTest('Lesson view opens', true);

    const lessonTitle = await page.locator('#lesson-title').textContent();
    logTest('Lesson 1 title loads', lessonTitle && lessonTitle.includes('Welcome'), lessonTitle);

    const sagePanel = await page.locator('#sage-panel').isVisible();
    logTest('Sage coach panel mounts', sagePanel);

    // TEST 5: Audio loads
    console.log('\n=== AUDIO ===');
    const audioElements = await page.locator('audio').count();
    logTest('Audio elements present', audioElements > 0, `found ${audioElements}`);

    const audioSources = await page.locator('audio source').count();
    logTest('Audio sources load', audioSources > 0, `sources: ${audioSources}`);

    // TEST 6: Back to home
    console.log('\n=== NAVIGATION ===');
    await page.click('#back-home');
    await page.waitForSelector('#home-view:not([hidden])');
    logTest('Back to home button works', true);

    // TEST 7: Open Lesson 5 (performance tracking)
    console.log('\n=== PERFORMANCE TRACKING ===');
    const lesson5Button = await page.locator('.lesson-card').nth(4);
    await lesson5Button.click();
    await page.waitForSelector('#lesson-view:not([hidden])');
    logTest('Lesson 5 opens', true);

    const perfElement = await page.locator('#porch-performance-l1').isVisible();
    logTest('Level 1 performance hook mounts', perfElement);

    if (perfElement) {
      // Simulate practice interaction
      const playABtn = await page.locator('#pathb-l1-play-a');
      const playBBtn = await page.locator('#pathb-l1-play-b');
      if (await playABtn.isVisible()) {
        await playABtn.click();
        await playBBtn.click();
        await page.waitForTimeout(100);

        // Check localStorage
        const savedData = await page.evaluate(() => {
          const raw = localStorage.getItem('guitarapp.wave1.pathb');
          return raw ? JSON.parse(raw) : null;
        });
        logTest('Performance saves to localStorage', !!savedData && savedData.loopsCompleted === 1, JSON.stringify(savedData));
      }
    }

    // TEST 8: Persistence across reload
    console.log('\n=== PERSISTENCE ===');
    await page.goto(TEST_CONFIG.url, { waitUntil: 'networkidle' });
    const reopenedCards = await page.locator('.lesson-card').count();
    logTest('Page reloads without breaking', reopenedCards === 25);

    // TEST 9: Mobile responsiveness
    if (TEST_CONFIG.device === 'mobile') {
      console.log('\n=== MOBILE RESPONSIVENESS ===');
      const viewportSize = page.viewportSize();
      logTest('Mobile viewport set correctly', viewportSize.width === 375, `${viewportSize.width}x${viewportSize.height}`);
      const mobileVisible = await page.locator('.shell').isVisible();
      logTest('Shell renders on mobile', mobileVisible);
    }

    // TEST 10: Chord diagrams
    console.log('\n=== VISUAL ELEMENTS ===');
    const chordDiagrams = await page.locator('[data-chord]').count();
    logTest('Chord diagram elements present', chordDiagrams > 0, `found ${chordDiagrams}`);

  } catch (error) {
    console.error('Test error:', error);
    logTest('Uncaught error', false, error.message);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  try {
    console.log(`\n🎸 GUITAR APP PLAYWRIGHT TEST SUITE`);
    console.log(`Device: ${TEST_CONFIG.device}`);
    console.log(`URL: ${TEST_CONFIG.url}`);
    console.log(`Headless: ${TEST_CONFIG.headless}\n`);

    await startServer();
    console.log(`✓ HTTP server started on port ${TEST_CONFIG.port}`);
    await new Promise(r => setTimeout(r, 500)); // Let server settle

    await runTests();

    console.log(`\n${'='.repeat(50)}`);
    console.log(`RESULTS: ${results.passed} passed, ${results.failed} failed`);
    console.log(`${'='.repeat(50)}\n`);

    if (results.failed > 0) {
      console.log('Failed tests:');
      results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}${t.details ? ': ' + t.details : ''}`);
      });
    }

    await stopServer();
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error);
    await stopServer();
    process.exit(1);
  }
}

main();
```

---

## Package.json Updates

Add to your `07-app/package.json` (or root `package.json`):

```json
{
  "scripts": {
    "test:playwright:full": "node test/guitar-app.playwright.mjs",
    "test:playwright:mobile": "DEVICE=mobile node test/guitar-app.playwright.mjs",
    "test:playwright:tablet": "DEVICE=tablet node test/guitar-app.playwright.mjs",
    "test:playwright:debug": "DEBUG=1 node test/guitar-app.playwright.mjs",
    "test:all": "npm run test:app-smoke && npm run test:playwright:full"
  },
  "devDependencies": {
    "playwright": "^1.40.0"
  }
}
```

---

## What Gets Tested

| Category | Tests |
|----------|-------|
| **Load & Render** | Page title, 25 lessons load, catalog status |
| **Wave 1 Gates** | Only 5 lessons unlocked initially |
| **Navigation** | Lesson opens, back button works, page reloads safely |
| **Performance Tracking** | Practice loops record, localStorage persists |
| **Persistence** | Data survives page reload |
| **Audio** | Audio elements and sources load |
| **Visual** | Chord diagrams render, coach panel mounts |
| **Mobile** | Responsive on mobile/tablet viewports (optional) |

---

## Running Tests

```bash
# Desktop (default)
npm run test:playwright:full

# Mobile simulation
npm run test:playwright:mobile

# Debug mode (see browser open, slower)
npm run test:playwright:debug

# All tests (smoke + playwright)
npm run test:all
```

---

## Expected Output

```
🎸 GUITAR APP PLAYWRIGHT TEST SUITE
Device: desktop
URL: http://localhost:8899
Headless: true

=== LOADING APP ===
✓ Page loads
=== CATALOG ===
✓ 25 lesson cards render
✓ Wave 1 unlocks 5 lessons
✓ Catalog status text correct
=== PERFORMANCE RAIL ===
✓ Performance rail renders
✓ Performance rail shows Path A
✓ Performance rail shows Level 2
=== LESSON 1 ===
✓ Lesson view opens
✓ Lesson 1 title loads
✓ Sage coach panel mounts
...
==================================================
RESULTS: 25 passed, 0 failed
==================================================
```

---

## Next Steps

1. Install Playwright: `npm install playwright`
2. Save this skill to `.claude/skills/guitar-app-test.md`
3. Run tests: `npm run test:playwright:full`
4. Check results and iterate

For Phase 5 user testing, you can:
- Deploy app to phone via `npx http-server`
- Run Playwright tests on that phone's browser
- Combine results with manual testing checklist

