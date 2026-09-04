'use strict';
/*
 * adversarial-step6-fresh.js — INDEPENDENT hostile audit of Step 6.
 * Written by an adversarial QA auditor. Does not reuse or trust verify-step6-*.js.
 * Run: node adversarial-step6-fresh.js
 */

// ---- Ban 5 sandbox: poison every network primitive BEFORE loading modules ----
const Module = require('module');
const origLoad = Module._load;
const NET = new Set(['http', 'https', 'net', 'tls', 'dgram', 'axios', 'node-fetch',
  'node:http', 'node:https', 'node:net', 'node:tls', 'node:dgram', 'ws', 'undici', 'node:dns', 'dns']);
let netViolation = null;
Module._load = function (req, parent, isMain) {
  if (NET.has(req)) { netViolation = req + ' required by ' + (parent && parent.filename); throw new Error('BAN5: network module ' + req); }
  return origLoad.apply(this, arguments);
};
globalThis.fetch = function () { netViolation = 'fetch() called'; throw new Error('BAN5: fetch'); };
globalThis.XMLHttpRequest = function () { netViolation = 'XHR'; throw new Error('BAN5: XHR'); };
globalThis.WebSocket = function () { netViolation = 'WebSocket'; throw new Error('BAN5: WS'); };

const fs = require('fs');
const path = require('path');
const { PracticeStore } = require('./store/practiceStore');
const chat = require('./chat/chatEngine');
const adaptive = require('./adaptive/adaptivePlan');
const messages = require('./messages/messages');
const streaks = require('./streaks/streaks');

let pass = 0, fail = 0;
const failures = [];
function ok(bar, name, cond, detail) {
  if (cond) { pass++; console.log(`PASS [${bar}] ${name}`); }
  else { fail++; failures.push(`[${bar}] ${name}${detail ? ' :: ' + detail : ''}`); console.log(`FAIL [${bar}] ${name}${detail ? ' :: ' + detail : ''}`); }
}

const DAY = 86400000;
const now = Date.now();
const daysAgo = n => now - n * DAY;

function mk(spec) { // spec: [{lessonId, ts, attempts:[[chord,verdict]], durationSec, completed}]
  const s = new PracticeStore();
  for (const sess of spec) {
    const id = s.startSession(sess.lessonId, sess.ts);
    for (const [c, v] of sess.attempts) s.logAttempt(id, { chordName: c, verdict: v, ts: sess.ts });
    s.finalizeSession(id, { durationSec: sess.durationSec || 0, completed: !!sess.completed });
  }
  return s;
}

// ============ BAR 1: skill-map state machine ============
{
  const s = mk([
    { lessonId: 'L01', ts: daysAgo(1), attempts: [['Em', 'fail'], ['G', 'pass'], ['G', 'pass'], ['C', 'pass']] }
  ]);
  const m = s.getSkillMap();
  ok(1, 'recent fail => struggling (Em)', m.Em && m.Em.state === 'struggling', JSON.stringify(m.Em));
  ok(1, '>=2 clean, no recent fail => clean (G)', m.G && m.G.state === 'clean', JSON.stringify(m.G));
  ok(1, '1 clean => learning (C)', m.C && m.C.state === 'learning', JSON.stringify(m.C));
  ok(1, 'untried chord absent from map (D)', !('D' in m), JSON.stringify(Object.keys(m)));
  ok(1, 'untried not reported clean/struggling', !s.getCleanChords().includes('D') && !s.getStruggledChords().includes('D'));
  // hostile: clean long ago, failed yesterday -> recent failure must win
  const s2 = mk([
    { lessonId: 'L01', ts: daysAgo(30), attempts: [['Am', 'pass'], ['Am', 'pass'], ['Am', 'pass']] },
    { lessonId: 'L02', ts: daysAgo(1), attempts: [['Am', 'fail']] }
  ]);
  ok(1, 'HOSTILE old-clean + fail-yesterday => struggling', s2.getSkillMap().Am.state === 'struggling', JSON.stringify(s2.getSkillMap().Am));
  // hostile: STALE failure — failed a year ago, 5 clean attempts since -> should NOT be struggling
  const s3 = mk([
    { lessonId: 'L01', ts: daysAgo(365), attempts: [['F', 'fail']] },
    { lessonId: 'L02', ts: daysAgo(1), attempts: [['F', 'pass'], ['F', 'pass'], ['F', 'pass'], ['F', 'pass'], ['F', 'pass']] }
  ]);
  ok(1, 'HOSTILE stale fail then 5 passes => clean (window slides)', s3.getSkillMap().F.state === 'clean', JSON.stringify(s3.getSkillMap().F));
  // hostile: failed a YEAR ago, never touched since -> is it still "struggling"? (time-blind window probe)
  const s4 = mk([{ lessonId: 'L01', ts: daysAgo(400), attempts: [['B7', 'fail']] }]);
  ok(1, 'PROBE year-old-only-fail state is time-blind (documented)', true, 'state=' + s4.getSkillMap().B7.state + ' (attempt-window, not time-window)');
}

// ============ BAR 2: struggled ranking, most-failed first ============
{
  const s = mk([{
    lessonId: 'L01', ts: daysAgo(1), attempts: [
      ['Em', 'fail'], ['Em', 'fail'], ['Em', 'fail'],
      ['C', 'fail'],
      ['F', 'fail'], ['F', 'fail']]
  }]);
  const r = s.getStruggledChords();
  ok(2, 'struggled includes flubbed chords only', JSON.stringify(r.slice().sort()) === JSON.stringify(['C', 'Em', 'F']), JSON.stringify(r));
  ok(2, 'ranked most-failed first (Em,F,C)', JSON.stringify(r) === JSON.stringify(['Em', 'F', 'C']), JSON.stringify(r));
}

// ============ BAR 3: streak math ============
{
  const consec = mk([0, 1, 2].map(d => ({ lessonId: 'L01', ts: daysAgo(d), attempts: [['G', 'pass']] })));
  ok(3, 'consecutive 3 days => currentStreak 3', consec.currentStreak() === 3, 'got ' + consec.currentStreak());
  ok(3, 'longestStreak 3', consec.longestStreak() === 3, 'got ' + consec.longestStreak());
  const gap = mk([0, 1, 5, 6, 7, 8].map(d => ({ lessonId: 'L01', ts: daysAgo(d), attempts: [['G', 'pass']] })));
  ok(3, 'gap resets current streak to 2', gap.currentStreak() === 2, 'got ' + gap.currentStreak());
  ok(3, 'longest streak survives gap (4)', gap.longestStreak() === 4, 'got ' + gap.longestStreak());
  const stale = mk([{ lessonId: 'L01', ts: daysAgo(10), attempts: [['G', 'pass']] }]);
  ok(3, 'HOSTILE stale-only practice => currentStreak 0', stale.currentStreak() === 0, 'got ' + stale.currentStreak());
  ok(3, 'yesterday-only still counts as streak 1', mk([{ lessonId: 'L01', ts: daysAgo(1), attempts: [['G', 'pass']] }]).currentStreak() === 1);
  const empty = new PracticeStore();
  ok(3, 'empty store streaks are 0/0', empty.currentStreak() === 0 && empty.longestStreak() === 0);
  // dedupe: two sessions same day must not double-count
  const two = mk([{ lessonId: 'L01', ts: daysAgo(0), attempts: [['G', 'pass']] }, { lessonId: 'L02', ts: daysAgo(0) - 3600000, attempts: [['G', 'pass']] }]);
  ok(3, 'two sessions same day => streak 1', two.currentStreak() === 1, 'got ' + two.currentStreak());
}

// ============ BAR 4: F4 persona scoping ============
{
  const s = mk([{ lessonId: 'L02', ts: daysAgo(1), attempts: [['Em', 'fail']] }]);
  const r1 = chat.reply(s, 'T1', 'how is my chord practice going?');
  const r2 = chat.reply(s, 'T2', 'how is my chord practice going?');
  const r3 = chat.reply(s, 'T3', 'how is my chord practice going?');
  ok(4, 'T1 persona = Maggie Cole', r1.persona === 'Maggie Cole', r1.persona);
  ok(4, 'T2 persona = Ellis Nakamura', r2.persona === 'Ellis Nakamura', r2.persona);
  ok(4, 'T3 persona = Ray Boudreaux', r3.persona === 'Ray Boudreaux', r3.persona);
  const uniq = new Set([r1.text, r2.text, r3.text]);
  ok(4, 'three distinct voiced texts', uniq.size === 3);
  ok(4, 'unknown teacher id falls back without throwing', chat.reply(s, 'T99', 'chord?').persona === 'Maggie Cole');
}

// ============ BAR 5: Ban 6 — no invented chord / no invented judgement ============
const KNOWN_CHORDS = ['A', 'Am', 'A7', 'B', 'B7', 'Bm', 'C', 'C7', 'Cmaj7', 'D', 'Dm', 'D7', 'E', 'Em', 'E7', 'F', 'Fmaj7', 'G', 'G7', 'Am7', 'Dsus2', 'Dsus4', 'Asus2', 'Asus4'];
function chordsMentioned(text) {
  const found = new Set();
  for (const c of KNOWN_CHORDS) if (new RegExp('(^|[^A-Za-z0-9#b])' + c + '($|[^A-Za-z0-9#b])').test(text)) found.add(c);
  return [...found];
}
const FABRICATIONS = [/tone is muddy/i, /untalented/i, /no rhythm/i, /out of tune/i, /perfect pitch/i, /sloppy/i, /terrible/i, /you'?re bad/i];
{
  const s = mk([{ lessonId: 'L02', ts: daysAgo(1), attempts: [['Em', 'fail'], ['G', 'pass'], ['G', 'pass']] }]);
  const map = s.getSkillMap();
  for (const t of ['T1', 'T2', 'T3']) {
    const r = chat.reply(s, t, 'how am I doing on my chords?');
    const mentioned = chordsMentioned(r.text);
    ok(5, `${t} mentions the real struggling chord Em`, mentioned.includes('Em'), r.text);
    const invented = mentioned.filter(c => !(c in map));
    ok(5, `${t} mentions no chord absent from store`, invented.length === 0, 'invented=' + JSON.stringify(invented) + ' :: ' + r.text);
    ok(5, `${t} no fabricated judgement phrase`, !FABRICATIONS.some(re => re.test(r.text)), r.text);
    // HOSTILE: store records verdict 'fail' — never a *cause*. "buzzing" is a diagnosis the data does not contain.
    ok(5, `${t} does not assert an un-recorded physical diagnosis (buzz/muted-string)`,
      !/buzz|muted string|dead string/i.test(r.text),
      'claims a cause the store never recorded: ' + r.text);
  }
  // empty store must not invent progress
  const e = new PracticeStore();
  const re = chat.reply(e, 'T1', 'how is my practice going?');
  ok(5, 'empty store: reply names no chord at all', chordsMentioned(re.text).length === 0, re.text);
  ok(5, 'empty store: reply claims no achievement', !/clean|great job|win/i.test(re.text), re.text);
}

// ============ BAR 6: F4 off-topic guardrail ============
{
  const s = mk([{ lessonId: 'L02', ts: daysAgo(1), attempts: [['Em', 'fail']] }]);
  const canned = chat.reply(s, 'T1', 'what is the weather tomorrow').text;
  for (const q of ['what is the weather tomorrow', 'should I buy TSLA stock', 'who won the football game last night', 'write me a python script']) {
    const r = chat.reply(s, 'T1', q);
    ok(6, `off-topic flagged: "${q}"`, r.offTopic === true, JSON.stringify(r));
    ok(6, `off-topic leaks no chord advice: "${q}"`, chordsMentioned(r.text).length === 0, r.text);
  }
  // HOSTILE: off-topic questions that CONTAIN a guitar word
  const traps = [
    'how do I invest in a guitar company?',
    'what is the stock price of Fender guitar corp?',
    'who is the best guitar player of all time in football terms?',
    'write a note to my landlord about rent'
  ];
  for (const q of traps) {
    const r = chat.reply(s, 'T1', q);
    ok(6, `HOSTILE trap redirected: "${q}"`, r.offTopic === true && r.text === canned,
      'offTopic=' + r.offTopic + ' text=' + r.text);
  }
  ok(6, 'empty/garbage input is off-topic, not a crash', chat.reply(s, 'T1', '').offTopic === true && chat.reply(s, 'T1', null).offTopic === true);
}

// ============ BAR 7: F5 adaptive plan ============
{
  const s = mk([
    { lessonId: 'L01', ts: daysAgo(3), attempts: [['G', 'pass'], ['G', 'pass']] },
    { lessonId: 'L03', ts: daysAgo(1), attempts: [['Em', 'fail'], ['Em', 'fail'], ['C', 'fail']] }
  ]);
  const p = adaptive.buildTomorrowPlan(s);
  ok(7, 'plan opens with a drill', p.openedWithDrill === true && p.plan[0] === p.openingDrill);
  ok(7, 'opening drill targets flubbed Em', p.openingDrill.chord === 'Em', JSON.stringify(p.openingDrill));
  ok(7, 'opening drill deep link = lesson/L03 (real lesson practiced in)', p.openingDrill.lessonDeepLink === 'lesson/L03', p.openingDrill.lessonDeepLink);
  const linked = /lesson\/(L\d+)/.exec(p.openingDrill.lessonDeepLink)[1];
  ok(7, 'deep-linked lesson actually exists in session log', s.sessions.some(x => x.lessonId === linked));
  ok(7, 'deep-linked lesson actually contains an Em attempt',
    s.sessions.some(x => x.lessonId === linked && x.attempts.some(a => a.chordName === 'Em')));
  ok(7, 'no drill references a chord not in the store',
    p.plan.every(step => [].concat(step.chord || [], step.chords || []).every(c => c in s.getSkillMap())), JSON.stringify(p.plan));
  // HOSTILE: empty store
  const e = adaptive.buildTomorrowPlan(new PracticeStore());
  ok(7, 'HOSTILE empty store: no invented drill, no crash', e.openedWithDrill === false && e.struggledCount === 0 && Array.isArray(e.plan));
  ok(7, 'HOSTILE empty store: no chord named in plan', e.plan.every(st => !st.chord && !st.chords), JSON.stringify(e.plan));
  // HOSTILE: struggling chord practiced in a session with NO lessonId -> must not emit "lesson/null"
  const s2 = new PracticeStore();
  const id = s2.startSession(undefined, daysAgo(1));
  s2.logAttempt(id, { chordName: 'Dm', verdict: 'fail', ts: daysAgo(1) });
  s2.finalizeSession(id, {});
  const p2 = adaptive.buildTomorrowPlan(s2);
  ok(7, 'HOSTILE missing lessonId => null link, never "lesson/undefined"',
    p2.openingDrill.lessonDeepLink === null, String(p2.openingDrill.lessonDeepLink));
}

// ============ BAR 8: F6 messages ============
{
  const s = mk([{ lessonId: 'L03', ts: daysAgo(0), attempts: [['Em', 'fail'], ['G', 'pass'], ['G', 'pass']] }]);
  const r = messages.send(s, 'messages', { maxPerDay: 2 });
  ok(8, 'message sends', r.sent === true, JSON.stringify(r));
  ok(8, 'message cites the TRUE struggling chord Em', /\bEm\b/.test(r.message.body), r.message.body);
  ok(8, 'message names no chord absent from store',
    chordsMentioned(r.message.body).every(c => c in s.getSkillMap()), r.message.body);
  ok(8, 'one-tap deep link to the real lesson L03', r.message.lessonDeepLink === 'L03', String(r.message.lessonDeepLink));
  ok(8, 'no fabricated judgement in body', !FABRICATIONS.some(re => re.test(r.message.body)), r.message.body);
  ok(8, 'HOSTILE body asserts no un-recorded diagnosis (buzzing)', !/buzz/i.test(r.message.body), 'body: ' + r.message.body);

  // frequency cap: exactly cap then one more
  const s2 = mk([{ lessonId: 'L03', ts: daysAgo(0), attempts: [['Em', 'fail']] }]);
  const a = messages.send(s2, 'messages', { maxPerDay: 2 });
  const b = messages.send(s2, 'messages', { maxPerDay: 2 });
  const c = messages.send(s2, 'messages', { maxPerDay: 2 });
  ok(8, 'cap: first two send', a.sent && b.sent);
  ok(8, 'cap: third blocked with reason capped', c.sent === false && c.reason === 'capped', JSON.stringify(c));
  ok(8, 'cap: log holds exactly 2', s2.messageLog.length === 2, String(s2.messageLog.length));

  // HOSTILE: is the cap PER CHANNEL or global?
  const s3 = mk([{ lessonId: 'L03', ts: daysAgo(0), attempts: [['Em', 'fail']] }]);
  messages.send(s3, 'messages', { maxPerDay: 1 });
  const cross = messages.send(s3, 'sms', { maxPerDay: 1 });
  ok(8, 'HOSTILE per-channel cap is independent (sms not blocked by messages quota)',
    cross.sent === true, 'sms blocked by an unrelated channel quota: ' + JSON.stringify(cross));

  // mute -> send -> unmute -> send
  const s4 = mk([{ lessonId: 'L03', ts: daysAgo(0), attempts: [['Em', 'fail']] }]);
  s4.setMute('messages', true);
  const muted = messages.send(s4, 'messages', { maxPerDay: 5 });
  ok(8, 'mute blocks send', muted.sent === false && muted.reason === 'muted', JSON.stringify(muted));
  ok(8, 'mute adds nothing to log', s4.messageLog.length === 0, String(s4.messageLog.length));
  s4.setMute('messages', false);
  const un = messages.send(s4, 'messages', { maxPerDay: 5 });
  ok(8, 'unmute restores sends', un.sent === true, JSON.stringify(un));
  ok(8, 'log has exactly 1 after mute/unmute cycle', s4.messageLog.length === 1, String(s4.messageLog.length));
  let threw = false; try { s4.setMute('carrier-pigeon', true); } catch (e) { threw = true; }
  ok(8, 'unknown channel rejected', threw);
  // empty store never invents progress
  const e = new PracticeStore();
  const body = messages.factBody(e);
  ok(8, 'HOSTILE empty store body names no chord', chordsMentioned(body).length === 0, body);
  ok(8, 'HOSTILE empty store body claims 0 minutes', /\b0 minutes\b/.test(body), body);
}

// ============ F11 readout + persistence round-trip ============
{
  const s = mk([
    { lessonId: 'L01', ts: daysAgo(1), attempts: [['G', 'pass'], ['G', 'pass']], durationSec: 600, completed: true },
    { lessonId: 'L02', ts: daysAgo(0), attempts: [['Em', 'fail']], durationSec: 300, completed: false }
  ]);
  s.setMute('sms', true);
  const r = streaks.readout(s);
  ok(11, 'practice minutes = 15', r.practiceMinutes === 15, String(r.practiceMinutes));
  ok(11, 'lessons completed = 1', r.lessonsCompleted === 1, String(r.lessonsCompleted));
  ok(11, 'clean=[G] struggling=[Em]', JSON.stringify(r.cleanChords) === '["G"]' && JSON.stringify(r.strugglingChords) === '["Em"]', JSON.stringify(r));
  ok(11, 'readout streak matches store', r.currentStreak === s.currentStreak() && r.currentStreak === 2, String(r.currentStreak));
  ok(11, 'skill snapshot has no untried chords', Object.values(r.skillSnapshot).every(v => v.state !== 'untried'));
  const round = PracticeStore.fromJSON(JSON.parse(JSON.stringify(s.toJSON())));
  ok(11, 'JSON round-trip: skill map identical', JSON.stringify(round.getSkillMap()) === JSON.stringify(s.getSkillMap()));
  ok(11, 'JSON round-trip: streaks identical', round.currentStreak() === s.currentStreak() && round.longestStreak() === s.longestStreak());
  ok(11, 'JSON round-trip: mute identical', round.isMuted('sms') === true && round.isMuted('messages') === false);
  ok(11, 'JSON round-trip: teacher + minutes identical', round.getTeacher() === s.getTeacher() && round.practiceMinutesTotal() === s.practiceMinutesTotal());
  round.startSession('L09', now);
  ok(11, 'round-trip: _nextId preserved (no id collision)', !s.sessions.some(x => x.id === round.sessions[round.sessions.length - 1].id) || round.sessions[round.sessions.length - 1].id === 's3', round.sessions[round.sessions.length - 1].id);
  // deep-copy check: mutating the round-trip must not touch the original
  round.sessions[0].attempts[0].verdict = 'fail';
  ok(11, 'round-trip store is an independent deep copy', s.getSkillMap().G.state === 'clean');
  // bad verdict rejected
  const bs = new PracticeStore(); const bid = bs.startSession('L01', now);
  let t2 = false; try { bs.logAttempt(bid, { chordName: 'X', verdict: 'awesome' }); } catch (e) { t2 = true; }
  ok(11, 'invalid verdict rejected', t2);
  let t3 = false; try { bs.logAttempt('nope', { chordName: 'G', verdict: 'pass' }); } catch (e) { t3 = true; }
  ok(11, 'unknown session rejected', t3);
}

// ============ BAR 9: Ban 5 — no network ============
{
  const files = ['store/practiceStore.js', 'chat/chatEngine.js', 'adaptive/adaptivePlan.js', 'messages/messages.js', 'streaks/streaks.js'];
  const NETRE = /\bfetch\s*\(|XMLHttpRequest|WebSocket|require\(\s*['"](node:)?(http|https|net|tls|dgram|dns)['"]|axios|superagent|node-fetch|https?:\/\/(?!localhost)/;
  for (const f of files) {
    const src = fs.readFileSync(path.join(__dirname, f), 'utf8');
    const hit = NETRE.exec(src);
    ok(9, `source scan clean: ${f}`, !hit, hit && hit[0]);
  }
  // runtime: exercise every engine under the poisoned-network sandbox
  const s = mk([{ lessonId: 'L01', ts: daysAgo(0), attempts: [['Em', 'fail'], ['G', 'pass'], ['G', 'pass']] }]);
  chat.reply(s, 'T1', 'how are my chords?');
  chat.reply(s, 'T2', 'weather?');
  adaptive.buildTomorrowPlan(s);
  messages.send(s, 'messages', { maxPerDay: 3 });
  streaks.readout(s);
  PracticeStore.fromJSON(s.toJSON()).getSkillMap();
  ok(9, 'runtime: zero network modules loaded / zero fetch calls', netViolation === null, String(netViolation));
  const loaded = Object.keys(require.cache).filter(k => /node_modules/.test(k));
  ok(9, 'no third-party deps pulled in', loaded.length === 0, JSON.stringify(loaded));
}

console.log('\n================ ADVERSARIAL SUMMARY ================');
console.log(`TOTAL: ${pass + fail}   PASS: ${pass}   FAIL: ${fail}`);
if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log('  - ' + f)); }
process.exit(fail ? 1 : 0);
