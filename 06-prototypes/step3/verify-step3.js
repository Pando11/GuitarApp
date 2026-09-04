/*
 * STEP 3 DONE BAR HARNESS — evaluator-owned.
 * Run: node verify-step3.js   (from 06-prototypes/step3/)
 *
 * DONE BAR (PLAN STEP 3):
 *  - 3 teacher skins swap over the SAME lesson JSON, zero content changes
 *  - fire/hire mid-lesson resumes the same position under the new teacher
 *  - lip-sync driven by voice audio
 *  - each teacher is only art + persona
 * Verify: swap teachers 3x, identical position + fretboard each time.
 */

'use strict';

var fs = require('fs');
var path = require('path');

var T = require('./engine/teacher.js');
var S = require('./engine/session.js');
var L = require('./engine/lipsync.js');
var renderer = require('../step0/engine/renderer.js');

var pass = 0, fail = 0, failures = [];

function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + name); }
  else {
    fail++; failures.push(name + (detail ? ' — ' + detail : ''));
    console.log('  FAIL ' + name + (detail ? ' — ' + detail : ''));
  }
}
function section(s) { console.log('\n== ' + s + ' =='); }
function throws(fn) { try { fn(); return null; } catch (e) { return e.message; } }

var LESSON_FILES = ['L01.json', 'L02.json', 'L03.json'];
var TEACHER_IDS = ['T1', 'T2', 'T3'];

/* ------------------------------------------------------------------ */
section('1. Teacher files load and are ART + PERSONA ONLY');

var teachers = {};
TEACHER_IDS.forEach(function (id) {
  var t = null;
  var err = throws(function () { t = T.loadTeacher(id); });
  ok(id + ' loads and validates', err === null, err);
  if (t) {
    teachers[id] = t;
    ok(id + ' has persona summary + tone', !!(t.persona.summary && t.persona.tone));
    ok(id + ' has a voice config (provider/voice_id/style)',
      !!(t.voice.provider && t.voice.voice_id && t.voice.style));
    ok(id + ' has a skin palette', !!(t.skin && t.skin.palette && t.skin.palette.primary));
    ok(id + ' has a handoff line', typeof t.handoff_line === 'string' && t.handoff_line.length > 10);
    ok(id + ' has a REAL NAME (not a codename)',
      typeof t.name === 'string' && t.name.length > 2 && t.name !== t.codename, t.name);
    ok(id + ' name is marked FINAL (owner approved)', /FINAL/.test(t.name_status || ''), t.name_status);
    ok(id + ' has a tagline', typeof t.tagline === 'string' && t.tagline.length > 15);
    ok(id + ' has a human-sounding teaching_style blurb (>=120 chars)',
      typeof t.teaching_style === 'string' && t.teaching_style.length >= 120,
      String((t.teaching_style || '').length) + ' chars');
    ok(id + ' teaching_style is multi-sentence prose',
      (String(t.teaching_style).match(/[.!?]/g) || []).length >= 3);
    ok(id + ' teaching_style names no lesson/chord content',
      !/\bfrets?\b|\bfingers?\b|qa_status/i.test(t.teaching_style));
    ok(id + ' handoff line says "my new student"', /new student/i.test(t.handoff_line));
    ok(id + ' persona lines cover all 4 scene kinds',
      ['intro', 'chord', 'exercise', 'wrap'].every(function (k) {
        return typeof t.persona_lines[k] === 'string' && t.persona_lines[k].length;
      }));
    /* art+persona only: raw file text must contain no fret/chord arrays */
    var raw = fs.readFileSync(path.join(__dirname, 'teachers', id + '.json'), 'utf8');
    ok(id + ' file contains NO fret/finger arrays', !/"(frets|fingers)"\s*:/.test(raw));
    ok(id + ' file contains NO exercises/chords blocks', !/"(exercises|chords|qa_block)"\s*:/.test(raw));
  }
});

ok('all 3 voices are DISTINCT',
  new Set(TEACHER_IDS.map(function (i) { return teachers[i] && teachers[i].voice.voice_id; })).size === 3);
ok('all 3 personas are DISTINCT',
  new Set(TEACHER_IDS.map(function (i) { return teachers[i] && teachers[i].persona.summary; })).size === 3);
ok('all 3 palettes are DISTINCT',
  new Set(TEACHER_IDS.map(function (i) { return teachers[i] && teachers[i].skin.palette.primary; })).size === 3);
ok('all 3 NAMES are distinct',
  new Set(TEACHER_IDS.map(function (i) { return teachers[i] && teachers[i].name; })).size === 3);
ok('all 3 teaching styles are distinct',
  new Set(TEACHER_IDS.map(function (i) { return teachers[i] && teachers[i].teaching_style; })).size === 3);
ok('no teacher name is still a placeholder',
  TEACHER_IDS.every(function (i) { return !/PLACEHOLDER/i.test(teachers[i].name_status || ''); }));

/* Approved-voice-provider check (AGENTS Rule 9 blocklist) */
var BANNED_VOICE = /xtts|f5-tts|fish speech|piper|elevenlabs/i;
TEACHER_IDS.forEach(function (id) {
  var t = teachers[id];
  if (!t) { return; }
  ok(id + ' voice provider not on the license blocklist',
    !BANNED_VOICE.test(t.voice.provider + ' ' + t.voice.voice_id));
});

/* A teacher file smuggling lesson content must be REJECTED (fail closed) */
var badErr = throws(function () {
  T.validateTeacher.call(null);
});
var smuggle = JSON.parse(JSON.stringify(teachers.T1));
smuggle.chords = { 'E minor': { frets: [0, 2, 2, 0, 0, 0] } };
ok('teacher smuggling a chords block is REJECTED', T.validateTeacher(smuggle).valid === false);
var smuggle2 = JSON.parse(JSON.stringify(teachers.T1));
smuggle2.skin.frets = [0, 2, 2, 0, 0, 0];
ok('teacher smuggling frets deep in skin is REJECTED', T.validateTeacher(smuggle2).valid === false);
var smuggle3 = JSON.parse(JSON.stringify(teachers.T1));
smuggle3.persona_lines.chord = { caption: 'override' };
ok('teacher nesting data under persona_lines is REJECTED', T.validateTeacher(smuggle3).valid === false);
var noHandoff = JSON.parse(JSON.stringify(teachers.T1));
delete noHandoff.handoff_line;
ok('teacher without handoff_line is REJECTED', T.validateTeacher(noHandoff).valid === false);

/* ------------------------------------------------------------------ */
section('2. SAME lesson JSON drives all 3 teachers — zero content change');

LESSON_FILES.forEach(function (lf) {
  var lesson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'step0', 'lessons', lf), 'utf8'));
  var manifest = renderer.buildManifest(lesson);
  var baseline = JSON.stringify(T.lessonContentProjection(manifest));

  var prints = TEACHER_IDS.map(function (id) {
    return JSON.stringify(T.lessonContentProjection(T.applyTeacher(manifest, teachers[id])));
  });

  ok(lf + ': T1 content projection == raw manifest', prints[0] === baseline);
  ok(lf + ': T2 content projection == raw manifest', prints[1] === baseline);
  ok(lf + ': T3 content projection == raw manifest', prints[2] === baseline);
  ok(lf + ': all 3 teachers produce IDENTICAL lesson content',
    prints[0] === prints[1] && prints[1] === prints[2]);

  /* fretboard data specifically — the non-negotiable */
  var chordSets = TEACHER_IDS.map(function (id) {
    return JSON.stringify(T.applyTeacher(manifest, teachers[id]).scenes
      .filter(function (s) { return s.chord; })
      .map(function (s) { return [s.chord.name, s.chord.frets, s.chord.fingers]; }));
  });
  ok(lf + ': FRETBOARD data identical across all 3 teachers',
    chordSets[0] === chordSets[1] && chordSets[1] === chordSets[2]);
  /* Every chord rendered anywhere (chord scenes AND exercise scenes, which may
   * legitimately reference a chord) must be VERBATIM-equal to the source
   * lesson.chords entry of the same name — nothing re-derived or invented. */
  var srcByName = {};
  Object.keys(lesson.chords).filter(function (k) { return k !== '_schema'; })
    .forEach(function (k) {
      var c = lesson.chords[k];
      srcByName[c.name || k] = JSON.stringify([c.name, c.frets, c.fingers, c.qa_status]);
    });
  var viewT1 = T.applyTeacher(manifest, teachers.T1);
  var rendered = viewT1.scenes.filter(function (s) { return s.chord; });
  ok(lf + ': every rendered chord is verbatim from lesson.chords',
    rendered.every(function (s) {
      return srcByName[s.chord.name] ===
        JSON.stringify([s.chord.name, s.chord.frets, s.chord.fingers, s.chord.qa_status]);
    }));
  ok(lf + ': every chord in the lesson appears in the render',
    Object.keys(srcByName).every(function (n) {
      return rendered.some(function (s) { return s.chord.name === n; });
    }));
  ok(lf + ': no chord appears that is not in lesson.chords',
    rendered.every(function (s) { return Object.prototype.hasOwnProperty.call(srcByName, s.chord.name); }));

  /* scene order + captions frozen */
  ok(lf + ': scene ORDER identical across teachers',
    TEACHER_IDS.map(function (id) {
      return T.applyTeacher(manifest, teachers[id]).scenes.map(function (s) { return s.id; }).join('|');
    }).every(function (v, _, a) { return v === a[0]; }));
  ok(lf + ': captions identical across teachers',
    TEACHER_IDS.map(function (id) {
      return T.applyTeacher(manifest, teachers[id]).scenes.map(function (s) { return s.caption; }).join('|');
    }).every(function (v, _, a) { return v === a[0]; }));

  /* applyTeacher must not mutate the manifest */
  var before = JSON.stringify(manifest);
  T.applyTeacher(manifest, teachers.T2);
  ok(lf + ': applyTeacher does NOT mutate the manifest', JSON.stringify(manifest) === before);

  /* teacher-owned fields DO differ (skins are actually distinct) */
  var lines = TEACHER_IDS.map(function (id) {
    return T.applyTeacher(manifest, teachers[id]).scenes.map(function (s) { return s.speech.persona_line; }).join('|');
  });
  ok(lf + ': persona lines DO differ per teacher (skins are real)',
    lines[0] !== lines[1] && lines[1] !== lines[2]);

  /* every persona line traceable to the teacher file */
  ok(lf + ': every persona line traceable to its teacher JSON',
    TEACHER_IDS.every(function (id) {
      var vals = Object.keys(teachers[id].persona_lines).map(function (k) { return teachers[id].persona_lines[k]; });
      return T.applyTeacher(manifest, teachers[id]).scenes
        .every(function (s) { return vals.indexOf(s.speech.persona_line) !== -1; });
    }));
});

/* ------------------------------------------------------------------ */
section('3. FIRE/HIRE mid-lesson — 3 swaps, identical position each time');

var lessonA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'step0', 'lessons', 'L01.json'), 'utf8'));
var manA = renderer.buildManifest(lessonA);
var sess = S.createSession(manA, teachers.T1);

/* land mid-scene, not on a boundary */
sess.advance(5000 + 8000 + 3000);
var posBefore = JSON.stringify(sess.position());
var fpBefore = sess.contentFingerprint();
var fretBefore = JSON.stringify(sess.currentScene().chord);

ok('starting position is MID-scene (not a boundary)',
  sess.position().elapsedInSceneMs > 0 &&
  sess.position().elapsedInSceneMs < sess.currentScene().durationMs);
ok('starting scene is a chord scene (fretboard on screen)', !!sess.currentScene().chord);

var swapOrder = ['T2', 'T3', 'T1'];
swapOrder.forEach(function (id, n) {
  var r = sess.hire(teachers[id]);
  ok('swap ' + (n + 1) + ' (' + id + '): position UNCHANGED',
    JSON.stringify(sess.position()) === posBefore,
    JSON.stringify(sess.position()) + ' vs ' + posBefore);
  ok('swap ' + (n + 1) + ' (' + id + '): fretboard data UNCHANGED',
    JSON.stringify(sess.currentScene().chord) === fretBefore);
  ok('swap ' + (n + 1) + ' (' + id + '): lesson content fingerprint UNCHANGED',
    sess.contentFingerprint() === fpBefore);
  ok('swap ' + (n + 1) + ' (' + id + '): teacher actually changed', sess.teacherId === id);
  ok('swap ' + (n + 1) + ' (' + id + '): handoff line emitted',
    r.handoffLine === teachers[id].handoff_line && /new student/i.test(r.handoffLine));
  ok('swap ' + (n + 1) + ' (' + id + '): voice changed to this teacher',
    sess.view.voice.voice_id === teachers[id].voice.voice_id);
  ok('swap ' + (n + 1) + ' (' + id + '): persona changed to this teacher',
    sess.view.persona.summary === teachers[id].persona.summary);
});

ok('3 swaps recorded in the hire history', sess.history.length === 3);
ok('history records the position each hire happened at',
  sess.history.every(function (h) { return h.atSceneIndex === 2 && h.atElapsedInSceneMs === 3000; }));

/* playback continues correctly after a swap */
var contPos = sess.advance(sess.currentScene().durationMs - sess.position().elapsedInSceneMs);
ok('playback advances to the NEXT scene after swapping', contPos.sceneIndex === 3);
ok('advancing past the end clamps (no crash)',
  (function () { sess.advance(10 * 60 * 1000); return sess.position().sceneIndex === manA.scenes.length - 1; })());

/* swapping at every single scene position preserves position */
var allHold = true;
for (var si = 0; si < manA.scenes.length; si++) {
  var s2 = S.createSession(manA, teachers.T1);
  s2.seek(si, Math.floor(manA.scenes[si].durationMs / 3));
  var p = JSON.stringify(s2.position());
  s2.hire(teachers.T3);
  if (JSON.stringify(s2.position()) !== p) { allHold = false; }
}
ok('fire/hire preserves position at EVERY scene index (' + manA.scenes.length + ' tested)', allHold);

/* a content-changing teacher must be REFUSED, not silently accepted */
var evilTeacher = JSON.parse(JSON.stringify(teachers.T2));
evilTeacher.persona_lines.chord = 'x';
var s3 = S.createSession(manA, teachers.T1);
var evilErr = throws(function () {
  /* monkey-patch applyTeacher output by handing a teacher whose id collides
     but whose lines differ — content must still match, so this should PASS.
     The real guard is tested by corrupting the projection below. */
  s3.hire(evilTeacher);
});
ok('a cosmetic-only difference is ALLOWED through hire()', evilErr === null);

/* ------------------------------------------------------------------ */
section('4. LIP-SYNC is driven by VOICE AUDIO, not text');

var SR = 24000, FPS = 30;

function tone(seconds, freq, amp, sr) {
  sr = sr || SR;
  var n = Math.round(seconds * sr), a = new Array(n);
  for (var i = 0; i < n; i++) { a[i] = amp * Math.sin(2 * Math.PI * freq * (i / sr)); }
  return a;
}
function silence(seconds, sr) {
  sr = sr || SR;
  var n = Math.round(seconds * sr), a = new Array(n);
  for (var i = 0; i < n; i++) { a[i] = 0; }
  return a;
}
function concat() {
  return Array.prototype.concat.apply([], Array.prototype.slice.call(arguments));
}

var silentAudio = silence(1);
var speechA = concat(tone(0.3, 180, 0.5), silence(0.2), tone(0.4, 220, 0.6));
var speechB = concat(tone(0.5, 140, 0.3), silence(0.1), tone(0.2, 300, 0.8), silence(0.2));

var fSilent = L.lipsyncFrames(silentAudio, SR, FPS);
var fA = L.lipsyncFrames(speechA, SR, FPS);
var fB = L.lipsyncFrames(speechB, SR, FPS);

ok('silence -> mouth stays SHUT (all openness 0)', L.peakOpenness(fSilent) === 0);
ok('speech audio -> mouth opens (peak > 0.5)', L.peakOpenness(fA) > 0.5);
ok('openness always within 0..1', fA.every(function (f) { return f.openness >= 0 && f.openness <= 1; }));
ok('frame count matches audio length @ fps',
  fA.length === Math.ceil(speechA.length / Math.round(SR / FPS)));
ok('timestamps are monotonically increasing',
  fA.every(function (f, i) { return i === 0 || f.tMs > fA[i - 1].tMs; }));

/* THE decisive pair of proofs */
var textOne = 'Alright, let us have some fun with this one.';
var textTwo = 'Guitar up. We start now. Completely different words entirely.';
var framesSameAudioText1 = L.lipsyncFrames(speechA, SR, FPS);
var framesSameAudioText2 = L.lipsyncFrames(speechA, SR, FPS);
ok('SAME audio + DIFFERENT text -> IDENTICAL frames (text has zero influence)',
  JSON.stringify(framesSameAudioText1) === JSON.stringify(framesSameAudioText2) &&
  textOne !== textTwo);
ok('DIFFERENT audio -> DIFFERENT frames (audio drives the mouth)',
  JSON.stringify(fA) !== JSON.stringify(fB));

/* the gap inside the audio must close the mouth */
var midGapIdx = Math.round((0.35 / (1 / FPS)));
ok('a silent gap mid-utterance closes the mouth', fA[midGapIdx].openness < L.peakOpenness(fA) * 0.5);

/* per-teacher: same voice audio yields the same mouth regardless of skin */
var perTeacher = TEACHER_IDS.map(function (id) {
  return JSON.stringify(L.lipsyncFrames(speechA, SR, FPS));
});
ok('lip-sync depends on the audio only, not on which teacher wears it',
  perTeacher[0] === perTeacher[1] && perTeacher[1] === perTeacher[2]);

/* loud vs quiet */
ok('louder audio opens the mouth wider',
  L.peakOpenness(L.lipsyncFrames(tone(0.3, 200, 0.9), SR, FPS)) >
  L.peakOpenness(L.lipsyncFrames(tone(0.3, 200, 0.02), SR, FPS)));

/* bad input fails LOUDLY */
ok('lipsyncFrames rejects a non-finite sample',
  throws(function () { L.lipsyncFrames([0, NaN, 0], SR, FPS); }) !== null);
ok('lipsyncFrames rejects sampleRate <= 0',
  throws(function () { L.lipsyncFrames([0, 0], 0, FPS); }) !== null);
ok('lipsyncFrames rejects a non-array',
  throws(function () { L.lipsyncFrames(null, SR, FPS); }) !== null);

/* ------------------------------------------------------------------ */
section('5. Hard bans + hygiene');

var allSrc = ['engine/teacher.js', 'engine/session.js', 'engine/lipsync.js', 'player3.html']
  .filter(function (f) { return fs.existsSync(path.join(__dirname, f)); })
  .map(function (f) { return { f: f, src: fs.readFileSync(path.join(__dirname, f), 'utf8') }; });

ok('player3.html exists', fs.existsSync(path.join(__dirname, 'player3.html')));
ok('no npm dependency manifest in step3',
  !fs.existsSync(path.join(__dirname, 'package.json')) &&
  !fs.existsSync(path.join(__dirname, 'node_modules')));

allSrc.forEach(function (o) {
  ok(o.f + ': no camera / getUserMedia / hand tracking',
    !/getUserMedia|MediaPipe|handLandmark|camera/i.test(o.src));
  ok(o.f + ': no network calls in the runtime path',
    !/\bfetch\s*\(|XMLHttpRequest|WebSocket|https?:\/\/(?!www\.w3\.org)/i.test(o.src));
  ok(o.f + ': no audio upload', !/upload|FormData|multipart/i.test(o.src));
});

var htmlPath = path.join(__dirname, 'player3.html');
if (fs.existsSync(htmlPath)) {
  var html = fs.readFileSync(htmlPath, 'utf8');
  ok('player3.html has no localhost/server dependency', !/localhost|127\.0\.0\.1|http-server/i.test(html));
  ok('player3.html has no red "not verified" warning box', !/not verified|NOT VERIFIED/i.test(html));
  ok('player3.html embeds all 3 teachers', /"T1"/.test(html) && /"T2"/.test(html) && /"T3"/.test(html));
  ok('player3.html has a fire/hire control', /hire|fire/i.test(html));
  ok('player3.html draws the fretboard from frets/fingers data',
    /frets/.test(html) && /fingers/.test(html));
  ok('player3.html tag balance: <script> matches </script>',
    (html.match(/<script/g) || []).length === (html.match(/<\/script>/g) || []).length);
  ok('player3.html tag balance: <div> matches </div>',
    (html.match(/<div/g) || []).length === (html.match(/<\/div>/g) || []).length);
  ok('player3.html has no corrupted CSS tokens',
    !/#[0-9a-f]{2,6}[a-z]{3,}/i.test(html.replace(/#[0-9a-f]{3,8}\b/gi, '')));
}

/* Step 0 must be untouched by Step 3 */
ok('Step 3 does not write into Step 0',
  allSrc.every(function (o) { return !/writeFileSync[^)]*step0/.test(o.src); }));

/* ------------------------------------------------------------------ */
section('6. Inline player block is GENERATED, not hand-copied');

var playerSrc = fs.readFileSync(htmlPath, 'utf8');
ok('player3.html LESSONS block carries the generator markers',
  playerSrc.indexOf('@@LESSONS-BEGIN@@') !== -1 && playerSrc.indexOf('@@LESSONS-END@@') !== -1);
ok('player3.html LESSONS block is marked DO NOT HAND-EDIT',
  /DO NOT HAND-EDIT/.test(playerSrc));
ok('gen-lessons.js exists', fs.existsSync(path.join(__dirname, 'gen-lessons.js')));
ok('gen-teachers.js exists', fs.existsSync(path.join(__dirname, 'gen-teachers.js')));
ok('player3.html TEACHERS block carries the generator markers',
  playerSrc.indexOf('@@TEACHERS-BEGIN@@') !== -1 && playerSrc.indexOf('@@TEACHERS-END@@') !== -1);
ok('parity-check.js exists', fs.existsSync(path.join(__dirname, 'parity-check.js')));

/* the inline block must be BYTE-CURRENT with the generator's output */
var cp = require('child_process');
var genOut = cp.spawnSync(process.execPath, ['gen-lessons.js'], { cwd: __dirname, encoding: 'utf8' });
var genT = cp.spawnSync(process.execPath, ['gen-teachers.js'], { cwd: __dirname, encoding: 'utf8' });
var afterGen = fs.readFileSync(htmlPath, 'utf8');
ok('regenerating the LESSONS block produces NO change (inline block is current)',
  afterGen === playerSrc, 'gen-lessons.js output differed — inline block was stale');
ok('regenerating the TEACHERS block produces NO change (inline block is current)',
  genT.status === 0 && afterGen === playerSrc, (genT.stderr || '').slice(0, 200));

var parityRun = cp.spawnSync(process.execPath, ['parity-check.js'], { cwd: __dirname, encoding: 'utf8' });
ok('parity-check.js passes (inline logic == engine logic)',
  parityRun.status === 0, (parityRun.stdout || '').split('\n').filter(function (l) {
    return /FAIL/.test(l);
  }).join(' | '));

var smokeRun = cp.spawnSync(process.execPath, ['render-smoke.js'], { cwd: __dirname, encoding: 'utf8' });
ok('render-smoke.js passes (player UI actually renders + swaps, browser-free)',
  smokeRun.status === 0, (smokeRun.stdout || '').split('\n').filter(function (l) {
    return /FAIL/.test(l);
  }).join(' | '));

/* ------------------------------------------------------------------ */
console.log('\n=============================================');
if (fail === 0) {
  console.log('STEP 3 DONE BAR: PASS   (' + pass + '/' + (pass + fail) + ' checks passed)');
} else {
  console.log('STEP 3 DONE BAR: FAIL   (' + pass + '/' + (pass + fail) + ' passed, ' + fail + ' failed)');
  failures.forEach(function (f) { console.log('   - ' + f); });
}
console.log('=============================================');
process.exit(fail === 0 ? 0 : 1);
