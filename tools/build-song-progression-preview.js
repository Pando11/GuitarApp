#!/usr/bin/env node
// Builds a double-clickable file:// HTML preview of the SONG-PROGRESSION track,
// including Mystery Mode. Reads ONLY the verified content files. Run the gate first.
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', '07-app', 'content', 'song-progressions');
const shapes = JSON.parse(fs.readFileSync(path.join(DIR, 'shapes.json'), 'utf8')).chords;
const songs = JSON.parse(fs.readFileSync(path.join(DIR, 'progressions.json'), 'utf8')).songs;
const OUT = path.join(DIR, 'song-progressions-preview.html');

const displayToKey = {};
for (const k of Object.keys(shapes)) displayToKey[k.replace(/easy$/, '')] = k;

// Render a chord as an inline SVG fretboard diagram from the verified fret/finger data.
function diagram(key) {
  const c = shapes[key]; if (!c) return '';
  const W = 92, H = 118, L = 16, T = 26, sp = 12, fs = 20;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="dg"><text x="${W / 2}" y="14" class="cn">${key.replace(/easy$/, '')}</text>`;
  for (let i = 0; i < 6; i++) s += `<line x1="${L + i * sp}" y1="${T}" x2="${L + i * sp}" y2="${T + 4 * fs}" class="st"/>`;
  for (let f = 0; f <= 4; f++) s += `<line x1="${L}" y1="${T + f * fs}" x2="${L + 5 * sp}" y2="${T + f * fs}" class="${f === 0 ? 'nut' : 'fr'}"/>`;
  c.frets.forEach((fr, i) => {
    const x = L + i * sp;
    if (fr === null) { s += `<text x="${x}" y="${T - 5}" class="mk">×</text>`; return; }
    if (fr === 0) { s += `<text x="${x}" y="${T - 5}" class="mk">○</text>`; return; }
    s += `<circle cx="${x}" cy="${T + (fr - 0.5) * fs}" r="5" class="dot"/>` +
         `<text x="${x}" y="${T + (fr - 0.5) * fs + 3.2}" class="fg">${c.fingers[i]}</text>`;
  });
  return s + '</svg>';
}

const card = s => {
  const keys = (s.chords || []).map(k => diagram(k)).join('');
  const loopChips = s.loop.split(/\s*-\s*/).map(t => {
    const bars = (t.match(/\((\d+)\)/) || [])[1];
    const name = t.replace(/\(.*?\)/g, '').trim();
    return `<span class="chip">${name}${bars ? `<i>×${bars}</i>` : ''}</span>`;
  }).join('<span class="arw">→</span>');
  return `<article class="card" data-id="${s.id}">
  <header>
    <div class="ttl"><span class="mystery-hide">${s.title}</span><span class="mystery-show">Mystery Song</span>
      <small class="mystery-hide">${s.artist}</small></div>
    <div class="meta">${s.key} · ${s.bpm} bpm · difficulty ${'●'.repeat(s.difficulty)}${'○'.repeat(3 - s.difficulty)}${s.public_domain ? ' · <b class="pd">PUBLIC DOMAIN</b>' : ''}</div>
  </header>
  <div class="loop">${loopChips}</div>
  <div class="dgs">${keys}</div>
  <p class="feel"><b>Feel:</b> ${s.feel}</p>
  <p class="claim mystery-hide"><b>What we teach:</b> ${s.honest_claim}</p>
  <ul class="teach">${(s.teaches || []).map(t => `<li>${t}</li>`).join('')}</ul>
  <div class="myst mystery-show">
    <p class="h1"><b>Hint 1:</b> ${s.mystery.hint_1}</p>
    <p class="h2 hidden"><b>Hint 2:</b> ${s.mystery.hint_2}</p>
    <p class="rv hidden"><b>Reveal:</b> ${s.mystery.reveal}</p>
    <button class="nx">Next hint</button>
  </div>
</article>`;
};

const html = `<!doctype html><meta charset="utf-8"><title>Song Progressions — verified preview</title>
<style>
:root{--bg:#12131a;--pn:#1b1d27;--ln:#2c3040;--tx:#e8eaf2;--mu:#9aa0b6;--ac:#ffb454;--gd:#5fd48b}
*{box-sizing:border-box}body{margin:0;padding:28px;background:var(--bg);color:var(--tx);
font:15px/1.55 -apple-system,Segoe UI,Roboto,sans-serif}
h1{margin:0 0 4px;font-size:25px}.sub{color:var(--mu);margin:0 0 8px}
.legal{background:#1a2b1f;border:1px solid #2e5c3f;border-radius:9px;padding:11px 14px;color:#bfe6cd;font-size:13px;margin:14px 0 6px}
.bar{display:flex;gap:10px;align-items:center;margin:16px 0 22px;flex-wrap:wrap}
button{background:var(--pn);color:var(--tx);border:1px solid var(--ln);border-radius:8px;padding:8px 14px;cursor:pointer;font-size:14px}
button:hover{border-color:var(--ac)}button.on{background:var(--ac);color:#1a1200;border-color:var(--ac);font-weight:600}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(360px,1fr))}
.card{background:var(--pn);border:1px solid var(--ln);border-radius:13px;padding:16px}
.ttl{font-size:18px;font-weight:650}.ttl small{display:block;font-weight:400;color:var(--mu);font-size:13px}
.meta{color:var(--mu);font-size:12.5px;margin-top:5px}.pd{color:var(--gd)}
.loop{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin:13px 0}
.chip{background:#252938;border:1px solid var(--ln);border-radius:7px;padding:4px 9px;font-weight:600;font-size:14px}
.chip i{color:var(--mu);font-style:normal;font-size:11px;margin-left:3px}
.arw{color:var(--mu);font-size:12px}
.dgs{display:flex;gap:4px;flex-wrap:wrap;margin:8px 0 10px}
.dg{width:74px;height:96px}.st,.fr{stroke:#4a5068;stroke-width:1}.nut{stroke:#c9cee0;stroke-width:2.5}
.cn{fill:var(--ac);font-size:11px;font-weight:700;text-anchor:middle}
.mk{fill:var(--mu);font-size:10px;text-anchor:middle}
.dot{fill:var(--ac)}.fg{fill:#1a1200;font-size:8px;font-weight:700;text-anchor:middle}
.feel,.claim{font-size:13px;color:var(--mu);margin:6px 0}
.claim{border-left:2px solid var(--ln);padding-left:9px}
.teach{margin:8px 0 0;padding-left:19px;font-size:13px;color:var(--mu)}
.myst{margin-top:10px;border-top:1px solid var(--ln);padding-top:10px;font-size:13.5px}
.myst .rv{color:var(--gd);font-weight:600}
.hidden{display:none}
body:not(.mystery) .mystery-show{display:none}
body.mystery .mystery-hide{display:none}
</style>
<h1>Song Progressions — verified preview</h1>
<p class="sub">${songs.length} progressions · ${Object.keys(shapes).length} chord shapes · every shape proven by arithmetic</p>
<div class="legal"><b>Legal boundary:</b> chord progressions + factual song titles only. No riffs, melodies, lyrics, or tab.
Nothing here was scraped from a tab site. Gate: <code>node tools/verify-song-progressions.js</code> ·
redline proven by <code>bash tools/test-legal-redline.sh</code> (22/22) · unlock rules proven by
<code>bash tools/test-song-progression-gate.sh</code> (21/21). The gate proves mechanics, not legal safety.
<br><b>Not affiliated with, endorsed by, or sponsored by any artist, band, or rights-holder.</b>
Song and artist names are used for factual identification only (AMENDMENT-14).
<br><i>Progressions are not yet reviewed for musical accuracy by a second party.</i></div>
<div class="bar">
  <button id="mt">🎭 Mystery Mode: OFF</button>
  <button data-f="all" class="on">All</button><button data-f="1">Easiest</button>
  <button data-f="2">Medium</button><button data-f="3">Hardest</button>
  <button data-f="pd">Public domain only</button>
</div>
<div class="grid" id="g">${songs.map(card).join('')}</div>
<script>
const SONGS = ${JSON.stringify(songs.map(s => ({ id: s.id, d: s.difficulty, pd: !!s.public_domain })))};
const mt = document.getElementById('mt');
mt.onclick = () => {
  const on = document.body.classList.toggle('mystery');
  mt.textContent = '🎭 Mystery Mode: ' + (on ? 'ON' : 'OFF');
  mt.classList.toggle('on', on);
  document.querySelectorAll('.h2,.rv').forEach(e => e.classList.add('hidden'));
  document.querySelectorAll('.nx').forEach(b => { b.textContent = 'Next hint'; b.disabled = false; });
};
document.querySelectorAll('.nx').forEach(b => b.onclick = () => {
  const c = b.closest('.card'), h2 = c.querySelector('.h2'), rv = c.querySelector('.rv');
  if (h2.classList.contains('hidden')) { h2.classList.remove('hidden'); b.textContent = 'Reveal the song'; }
  else { rv.classList.remove('hidden'); b.disabled = true; b.textContent = 'Revealed'; }
});
document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
  document.querySelectorAll('[data-f]').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  const f = b.dataset.f;
  SONGS.forEach(s => {
    const el = document.querySelector('[data-id="' + s.id + '"]');
    el.style.display = (f === 'all' || (f === 'pd' && s.pd) || String(s.d) === f) ? '' : 'none';
  });
});
</script>`;
fs.writeFileSync(OUT, html, 'utf8');
console.log('wrote ' + OUT + ' (' + html.length + ' bytes)');
