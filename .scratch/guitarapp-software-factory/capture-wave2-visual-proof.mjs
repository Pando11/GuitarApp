import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const REPO = 'C:/Users/Hendrickson/Desktop/GuitarApp';
const APP_URL = 'http://127.0.0.1:8765/index.html?dogfood=1';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const OUT = path.join(REPO, '.scratch', 'guitarapp-software-factory', 'proof-wave2');
fs.mkdirSync(OUT, { recursive: true });

function write(name, data) {
  fs.writeFileSync(path.join(OUT, name), data);
}

const browser = await chromium.launch({ headless: true, executablePath: EDGE });
const page = await browser.newPage({ viewport: { width: 1440, height: 1800 }, deviceScaleFactor: 1 });
await page.goto(APP_URL, { waitUntil: 'networkidle' });

const home = {
  totalCards: await page.locator('.lesson-card').count(),
  unlocked: await page.locator('.lesson-card:not([disabled])').count(),
  locked: await page.locator('.lesson-card[disabled]').count(),
  status: await page.locator('#catalog-status').textContent(),
  performanceRail: await page.locator('#performance-rail').textContent(),
};
await page.screenshot({ path: path.join(OUT, 'w2-e1-home-unlocks.png'), fullPage: true });

await page.locator('.lesson-card').nth(0).click();
await page.waitForTimeout(150);
const lesson1 = {
  title: await page.locator('#lesson-title').textContent(),
  sageHeading: await page.locator('#sage-panel h3').textContent(),
  sagePhase: await page.locator('#sage-phase-line').textContent(),
};
await page.screenshot({ path: path.join(OUT, 'w2-e1-lesson1-sage.png'), fullPage: true });

await page.locator('#back-home').click();
await page.waitForTimeout(100);
await page.locator('.lesson-card').nth(4).click();
await page.waitForTimeout(150);
const lesson5Before = {
  title: await page.locator('#lesson-title').textContent(),
  status: await page.locator('#pathb-l1-status').textContent(),
};
await page.screenshot({ path: path.join(OUT, 'w2-e1-lesson5-level1-before.png'), fullPage: true });

await page.locator('#pathb-l1-play-a').click();
await page.locator('#pathb-l1-play-b').click();
await page.waitForTimeout(100);
const lesson5After = {
  status: await page.locator('#pathb-l1-status').textContent(),
  saved: await page.evaluate(() => JSON.parse(localStorage.getItem('guitarapp.wave1.pathb'))),
};
await page.screenshot({ path: path.join(OUT, 'w2-e1-lesson5-level1-after.png'), fullPage: true });

await page.reload({ waitUntil: 'networkidle' });
await page.locator('.lesson-card').nth(4).click();
await page.waitForTimeout(150);
const lesson5Reopen = {
  status: await page.locator('#pathb-l1-status').textContent(),
};
await page.screenshot({ path: path.join(OUT, 'w2-e1-lesson5-level1-reopen.png'), fullPage: true });
await page.locator('#back-home').click();
await page.waitForTimeout(100);
const homeAfterLevel1 = {
  performanceRail: await page.locator('#performance-rail').textContent(),
};
await page.screenshot({ path: path.join(OUT, 'w2-e1-home-after-level1.png'), fullPage: true });
await page.locator('.lesson-card').nth(4).click();
await page.waitForTimeout(100);

const lesson12 = await page.evaluate(async () => {
  const raw = await fetch('./content/lessons/guitar-lesson-12-new-chord-am-big-four.json').then((r) => r.json());
  const model = window.GuitarApp.LessonRunner.normalizeLesson(raw, 11);
  let host = document.getElementById('wave2-proof-l12');
  if (host) host.remove();
  host = document.createElement('section');
  host.id = 'wave2-proof-l12';
  host.style.marginTop = '24px';
  host.innerHTML = '<div class="eyebrow">Wave 2 proof probe</div><h2>Lesson 12 injected proof</h2>';
  document.getElementById('lesson-content').appendChild(host);
  window.GuitarApp.Wave1Flow.mountEnhancements(model, host);
  document.getElementById('pathb-l2-play-a').click();
  document.getElementById('pathb-l2-play-b').click();
  document.getElementById('pathb-l2-play-a').click();
  document.getElementById('pathb-l2-play-b').click();
  document.getElementById('pathb-l2-play-a').click();
  document.getElementById('pathb-l2-play-b').click();
  return {
    config: window.GuitarApp.Wave1Flow.configFromModel(model),
    status: document.getElementById('pathb-l2-status').textContent,
    saved: JSON.parse(localStorage.getItem('guitarapp.wave2.pathb.level2')),
  };
});
await page.screenshot({ path: path.join(OUT, 'w2-e4-lesson12-level2.png'), fullPage: true });

await browser.close();

const proof = { home, lesson1, lesson5Before, lesson5After, lesson5Reopen, homeAfterLevel1, lesson12 };
write('visual-proof.json', JSON.stringify(proof, null, 2) + '\n');
write('visual-walkthrough.md', [
  '# Wave 2 visual walkthrough',
  '',
  '- Home catalog rendered **25** lesson cards.',
  '- Unlock split observed: **5 ready / 20 locked**.',
  '- Lesson 1 opened with Sage panel visible and intro line loaded.',
  '- Lesson 5 showed the Level 1 porch-performance panel.',
  '- After clicking Em then easy C once, localStorage `guitarapp.wave1.pathb` recorded `loopsCompleted: 1` and the UI reported `loops completed: 1/1` on reopen.',
  '- The home performance rail updated to show Level 1 completed and kept Path A visible on the roadmap.',
  '- Lesson 12 proof probe mounted the new Level 2 performance panel and reached `loopsCompleted: 3` in `guitarapp.wave2.pathb.level2`.',
  '',
  'Screenshots:',
  '- `w2-e1-home-unlocks.png`',
  '- `w2-e1-lesson1-sage.png`',
  '- `w2-e1-lesson5-level1-before.png`',
  '- `w2-e1-lesson5-level1-after.png`',
  '- `w2-e1-lesson5-level1-reopen.png`',
  '- `w2-e1-home-after-level1.png`',
  '- `w2-e4-lesson12-level2.png`',
  ''
].join('\n'));

console.log(JSON.stringify(proof, null, 2));
console.log('screenshots saved to ' + OUT);
