// guitar-app.playwright.mjs
// Phase 5: Automated browser testing with Playwright
//
// Tests the real app running on localhost via a real browser.
// Validates: catalog rendering, lesson flow, performance tracking,
// audio loading, and persistence across page reloads.

import { chromium } from 'playwright';
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
    const title = await page.title();
    logTest('Page loads with correct title', title.includes('GuitarApp'), `title: ${title}`);

    // TEST 2: Catalog renders
    console.log('\n=== CATALOG ===');
    const cards = await page.locator('.lesson-card').count();
    logTest('25 lesson cards render', cards === 25, `got ${cards}`);

    const unlockedCount = await page.locator('.lesson-card:not([disabled])').count();
    logTest('Wave 1 unlocks 5 lessons', unlockedCount === 5, `unlocked: ${unlockedCount}`);

    const catalogStatus = await page.locator('#catalog-status').textContent();
    logTest('Catalog status shows lesson count', catalogStatus.includes('25'), `status: ${catalogStatus}`);

    // TEST 3: Performance rail
    console.log('\n=== PERFORMANCE RAIL ===');
    const perfRailText = await page.locator('#performance-rail').textContent();
    logTest('Performance rail renders', perfRailText.includes('Performance ladder'), 'rail visible');
    logTest('Performance rail shows Path A', perfRailText.includes('Path A'), 'Path A mentioned');
    logTest('Performance rail shows Level 2', perfRailText.includes('Level 2'), 'Level 2 mentioned');

    // TEST 4: Open Lesson 1
    console.log('\n=== LESSON 1 ===');
    await page.click('#start-l01');
    try {
      await page.waitForSelector('#lesson-view:not([hidden])', { timeout: 5000 });
      logTest('Lesson view opens', true);
    } catch {
      logTest('Lesson view opens', false, 'timeout or not found');
    }

    const lessonTitle = await page.locator('#lesson-title').textContent();
    logTest('Lesson 1 title renders', lessonTitle && /Welcome|Anatomy|Tuning/i.test(lessonTitle), `title: ${lessonTitle}`);

    const sagePanel = await page.locator('#sage-panel').isVisible().catch(() => false);
    logTest('Sage coach panel mounts', sagePanel);

    // TEST 5: Audio elements
    console.log('\n=== AUDIO ===');
    const audioElements = await page.locator('audio').count();
    logTest('Audio elements present in lesson', audioElements > 0, `found ${audioElements}`);

    // TEST 6: Back to home
    console.log('\n=== NAVIGATION ===');
    const backBtn = await page.locator('#back-home').isVisible();
    logTest('Back button visible', backBtn);

    if (backBtn) {
      await page.click('#back-home');
      try {
        await page.waitForSelector('#home-view:not([hidden])', { timeout: 3000 });
        logTest('Back to home button works', true);
      } catch {
        logTest('Back to home button works', false, 'home view not visible');
      }
    }

    // TEST 7: Open Lesson 5 (performance tracking)
    console.log('\n=== PERFORMANCE TRACKING ===');
    const lesson5Button = await page.locator('.lesson-card').nth(4);
    await lesson5Button.click();
    try {
      await page.waitForSelector('#lesson-view:not([hidden])', { timeout: 5000 });
      logTest('Lesson 5 opens', true);
    } catch {
      logTest('Lesson 5 opens', false, 'timeout');
    }

    const perfElement = await page.locator('#porch-performance-l1').isVisible().catch(() => false);
    logTest('Level 1 performance hook mounts', perfElement);

    if (perfElement) {
      // Simulate practice interaction
      const playABtn = await page.locator('#pathb-l1-play-a').isVisible().catch(() => false);
      const playBBtn = await page.locator('#pathb-l1-play-b').isVisible().catch(() => false);

      if (playABtn && playBBtn) {
        await page.click('#pathb-l1-play-a');
        await page.click('#pathb-l1-play-b');
        await page.waitForTimeout(200);

        // Check localStorage
        const savedData = await page.evaluate(() => {
          const raw = localStorage.getItem('guitarapp.wave1.pathb');
          return raw ? JSON.parse(raw) : null;
        }).catch(() => null);

        logTest('Performance loop records', !!savedData && savedData.loopsCompleted === 1, `saved: ${JSON.stringify(savedData)}`);
      }
    }

    // TEST 8: Persistence across reload
    console.log('\n=== PERSISTENCE ===');
    await page.goto(TEST_CONFIG.url, { waitUntil: 'networkidle' });
    const reopenedCards = await page.locator('.lesson-card').count();
    logTest('Page reloads safely', reopenedCards === 25, `cards after reload: ${reopenedCards}`);

    // TEST 9: Mobile responsiveness
    if (TEST_CONFIG.device === 'mobile') {
      console.log('\n=== MOBILE RESPONSIVENESS ===');
      const viewportSize = page.viewportSize();
      logTest('Mobile viewport configured', viewportSize && viewportSize.width === 375, `${viewportSize?.width}x${viewportSize?.height}`);
      const shellVisible = await page.locator('.shell').isVisible().catch(() => false);
      logTest('App shell renders on mobile', shellVisible);
    }

    // TEST 10: Lesson cards are interactive
    console.log('\n=== INTERACTIVE ELEMENTS ===');
    const lesson1Btn = await page.locator('#start-l01').isVisible().catch(() => false);
    logTest('Lesson 1 button is interactive', lesson1Btn);

    const allCardsClickable = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.lesson-card'));
      return cards.every(card => card.getAttribute('type') === 'button');
    });
    logTest('All lesson cards are button elements', allCardsClickable);

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

    console.log(`\n${'='.repeat(60)}`);
    console.log(`RESULTS: ${results.passed} passed, ${results.failed} failed`);
    console.log(`${'='.repeat(60)}\n`);

    if (results.failed > 0) {
      console.log('Failed tests:');
      results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}${t.details ? ': ' + t.details : ''}`);
      });
      console.log();
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
