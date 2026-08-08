'use strict';
/*
 * gen-paywall-demo.js — generates 06-prototypes/step7/paywall-demo.html.
 *
 * NEVER hand-transcribe the entitlement logic into HTML (that invented-wrong-
 * content bug burned Step 3). Instead this reads the REAL entitlementStore.js,
 * strips only the CommonJS `module.exports` tail, and inlines the exact same
 * class the verify/adversarial suites run, so the demo can never drift from the
 * proven logic. Emits a self-contained file:// page (no CDN, no localhost).
 */
const fs = require('fs'), path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'entitlementStore.js'), 'utf8');
// keep the class + module-level maps, drop the Node export so it runs in a browser
const inlined = src.replace(/module\.exports\s*=\s*\{[\s\S]*?\};\s*$/, '');
if (inlined === src) throw new Error('could not strip module.exports — check entitlementStore.js tail');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GuitarApp — Paywall (Step 7 demo)</title>
<style>
  :root { --bg:#0f1226; --card:#1b1f3b; --ink:#e8eaff; --muted:#9aa0c7; --accent:#7c5cff; --ok:#3ddc84; --lock:#ff6b6b; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:-apple-system,Segoe UI,Roboto,sans-serif; background:var(--bg); color:var(--ink); padding:18px; }
  h1 { font-size:20px; margin:0 0 4px; }
  .sub { color:var(--muted); font-size:13px; margin-bottom:16px; }
  .row { display:flex; flex-wrap:wrap; gap:10px; margin-bottom:14px; }
  button { font-size:14px; padding:10px 14px; border:0; border-radius:10px; background:var(--card); color:var(--ink); cursor:pointer; }
  button.primary { background:var(--accent); }
  button:active { transform:translateY(1px); }
  .lessons { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:10px; margin-bottom:16px; }
  .lesson { background:var(--card); border-radius:12px; padding:14px; text-align:center; }
  .lesson .name { font-weight:700; font-size:15px; }
  .lesson .state { font-size:12px; margin-top:6px; }
  .open { color:var(--ok); }
  .locked { color:var(--lock); }
  #status { background:var(--card); border-radius:12px; padding:14px; font-size:13px; line-height:1.5; }
  #status b { color:var(--accent); }
  .pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; background:#2a2f55; color:var(--muted); margin-left:6px; }
</style>
</head>
<body>
<h1>GuitarApp — Paywall</h1>
<div class="sub">$12/mo &middot; free = tuner + metronome + Lesson 1 only. (Sandbox demo — no real App Store purchase.)</div>

<div class="row">
  <button id="buy" class="primary">Sandbox buy $12/mo</button>
  <button id="cancel">Cancel</button>
  <button id="resub">Re-subscribe</button>
  <button id="trial">Start 7-day trial</button>
</div>

<div class="lessons" id="lessons"></div>

<div id="status">Loading&hellip;</div>

<script>
${inlined}

const store = new EntitlementStore();

const LESSONS = [
  { id:'L01', title:'Tuner & first chord', free:true },
  { id:'L02', title:'Two-chord change' },
  { id:'L05', title:'Open chords' },
  { id:'L10', title:'Core open chords' },
  { id:'L15', title:'Strumming' },
  { id:'L20', title:'Read a chord chart' },
];

function lessonState(l){
  const ok = store.canAccessLesson(l.id);
  return ok ? 'open' : 'locked';
}

function render(){
  const box = document.getElementById('lessons');
  box.innerHTML = '';
  for (const l of LESSONS){
    const ok = store.canAccessLesson(l.id);
    const div = document.createElement('div');
    div.className = 'lesson';
    div.innerHTML = '<div class="name">'+l.id+'</div><div class="state '+(ok?'open':'locked')+'">'+(ok?'UNLOCKED':'🔒 paywall')+'</div>';
    box.appendChild(div);
  }
  const tier = store.isPremium() ? 'PREMIUM ($12/mo)' : 'FREE';
  const sandbox = store.sandbox ? ' <span class="pill">sandbox</span>' : '';
  const trial = (store.trialActive && store.trialExpiry && Date.now() < store.trialExpiry) ? ' <span class="pill">trial active</span>' : '';
  document.getElementById('status').innerHTML =
    'Tier: <b>'+tier+'</b>'+sandbox+trial+' &middot; platform: <b>'+store.platform+'</b><br>'+
    'Free sees: tuner + metronome + Lesson 1. Everything else hits the paywall.';
}

document.getElementById('buy').onclick = ()=>{ store.activateSandboxPurchase('ios'); render(); };
document.getElementById('cancel').onclick = ()=>{ store.cancel(); render(); };
document.getElementById('resub').onclick = ()=>{ store.resubscribe('ios'); render(); };
document.getElementById('trial').onclick = ()=>{ store.startTrial(7); render(); };

render();
window.__store = store; // exposed for the DOM-stub smoke test
</script>
</body>
</html>
`;

const out = path.join(__dirname, 'paywall-demo.html');
fs.writeFileSync(out, html);
console.log('WROTE ' + out + ' (' + html.length + ' bytes)');
console.log('inline class present: ' + /class EntitlementStore/.test(html));
console.log('module.exports stripped: ' + !/module\.exports/.test(html));
