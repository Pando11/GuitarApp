// app.js — PWA controller: router + screens, wired to the proven engine core.
import { AppState } from './lib/storage.js';
import { loadCoreLessons, loadPacks, loadTeachers, loadJson } from './lib/catalog.js';
import { buildManifest, chordSVG } from './core/renderer.js';
import { applyTeacher, validateTeacher } from './core/teacher.js';
import { MicAnalyzer, playBuffer, speak, startListening, isMicAvailable, micUnavailableMessage } from './audio/audioio.js';
import * as T from './core/tuner-engine.js';
import * as B from './core/band-engine.js';
import * as V from './core/voice-command.js';
import { reply as chatReply } from './core/chatEngine.js';
import { buildTomorrowPlan, planNext } from './core/adaptivePlan.js';
import { readout as progressReadout } from './core/streaks.js';
import { isDogfood, setDogfood } from './lib/dogfood.js';
import { measureOneMinute } from './../06-prototypes/practice-engine/one-minute-changes.mjs';
import { createFluencyStore } from './../06-prototypes/practice-engine/fluency-store.mjs';
import { pairKey } from './../06-prototypes/practice-engine/pair-key.mjs';
import { createCoachSurface, closeCoachSurface } from './core/coachSurface.js';

const app = new AppState();
let CATALOG = { lessons: [], packs: [], teachers: [] };
let CURRENT_TEACHER = null;
const screen = document.getElementById('screen');

// ---------- helpers ----------
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
}
function isPremium() { return app.dogfood || app.entitlement.isPremium(); }
function canLesson(id) { return app.dogfood || app.entitlement.canAccessLesson(id); }
function guardPremium(feature, fn) {
  // B1: LOCAL dogfood unlock layers on top of the production entitlement decision
  // without touching core/entitlementStore.js. A dogfood user passes every gate.
  if (app.dogfood) { fn(); return; }
  const d = app.entitlement.paywallDecision(feature);
  if (!d.allowed) { renderPaywall(feature); return; }
  fn();
}
function save() { app.save(); }

// ---------- router ----------
const routes = {
  home: renderHome, lessons: renderLessons, tuner: renderTuner, metronome: renderMetronome,
  roster: renderRoster, chat: renderChat, plan: renderPlan, progress: renderProgress,
  band: renderBand, packs: renderPacks, upgrade: renderUpgrade, lesson: renderLesson,
  practice: renderPractice, teacherDetail: renderTeacherDetail
};
let stopActiveTuner = null;  // set by renderTuner; torn down when leaving the screen
function navigate(route, params) {
  document.getElementById('sidenav').classList.add('hidden');
  if (stopActiveTuner) { try { stopActiveTuner(); } catch (e) {} stopActiveTuner = null; }
  const fn = routes[route] || renderHome;
  screen.innerHTML = '';
  fn(params || {});
  window.scrollTo(0, 0);
}
document.querySelectorAll('[data-route]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.route)));
document.getElementById('hamburger').addEventListener('click', () => document.getElementById('sidenav').classList.toggle('hidden'));

function refreshTeacherChip() {
  const chip = document.getElementById('teacher-chip');
  const t = CURRENT_TEACHER || CATALOG.teachers.find(t => t.id === app.settings.currentTeacherId);
  chip.textContent = t ? ('👤 ' + t.name) : '';
}

// ---------- screens ----------
function renderHome() {
  refreshTeacherChip();
  const streak = app.store.currentStreak();
  const h1 = el('h1', { text: 'Learn guitar. The app listens.' });
  if (app.dogfood) {
    h1.appendChild(el('span', { class: 'dogfood-badge', text: 'DOGFOOD' }));
    h1.appendChild(document.createTextNode(' '));
    h1.appendChild(el('a', { class: 'dogfood-feedback', href: 'feedback.html', text: 'feedback' }));
  }
  screen.appendChild(el('div', { class: 'hero' }, [
    h1,
    el('p', { class: 'sub', text: 'Absolute beginners. Animated lessons, a teacher in your pocket, and a band that follows your tempo.' })
  ]));
  const row = el('div', { class: 'card-row' });
  if (!isPremium()) row.appendChild(el('div', { class: 'cta premium' }, [
    el('strong', { text: 'Start your 7-day free trial — $12/mo after' }),
    el('button', { class: 'btn', text: 'Try free', onclick: () => { app.startFreeTrial(); save(); navigate('upgrade'); } })
  ]));
  screen.appendChild(row);
  const grid = el('div', { class: 'quick-grid' });
  [['lessons', '📚 Lessons'], ['tuner', '🎯 Free Tuner'], ['metronome', '⏱ Metronome'],
   ['roster', '👤 Teachers'], ['chat', isPremium() ? '💬 Ask Teacher' : '💬 Ask Teacher (Pro)'],
   ['practice', '🎯 Practice Drills'], ['plan', '🗺 Practice Plan'], ['progress', '🔥 ' + streak + '-day streak'], ['band', '🎸 Band']].forEach(([r, label]) => {
    grid.appendChild(el('button', { class: 'quick', 'data-route': r, text: label }));
  });
  screen.appendChild(grid);
  grid.querySelectorAll('[data-route]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.route)));
}

function renderLessons() {
  screen.appendChild(el('h2', { text: 'Lessons' }));
  if (!isPremium() && !canLesson('L01')) { renderPaywall('lesson'); return; }
  const list = el('div', { class: 'list' });
  CATALOG.lessons.forEach((lesson, i) => {
    const locked = !canLesson(lesson.id);
    const item = el('button', { class: 'list-item' + (locked ? ' locked' : ''), onclick: () => { if (locked) renderPaywall('lesson'); else navigate('lesson', { id: lesson.id, path: lesson.path, raw: lesson.raw }); } }, [
      el('span', { text: (i + 1) + '. ' + lesson.title }),
      el('span', { class: 'badge', text: locked ? '🔒 Pro' : '✓' })
    ]);
    list.appendChild(item);
  });
  screen.appendChild(list);
  // style packs section
  screen.appendChild(el('h3', { text: 'Style Packs' }));
  const packs = el('div', { class: 'list' });
  CATALOG.packs.forEach(pack => {
    packs.appendChild(el('button', { class: 'list-item', onclick: () => navigate('packs', { packId: pack.id }) }, [
      el('span', { text: pack.name + ' (' + pack.lessons.length + ' lessons)' }),
      el('span', { class: 'badge', text: isPremium() ? '✓' : '🔒 Pro' })
    ]));
  });
  screen.appendChild(packs);
}

function renderLesson(params) {
  const lesson = params.raw;
  const manifest = buildManifest(lesson);
  // F2/F3: a lesson opened from a Style Pack can name its own teacher (e.g. Roscoe
  // for the Blues pack). That teacher is now in CATALOG.teachers after boot injection,
  // so we resolve it specifically; otherwise fall back to the user's chosen teacher.
  const packTeacher = params.packTeacherId
    ? CATALOG.teachers.find(t => t.id === params.packTeacherId)
    : null;
  const teacher = packTeacher
    || CURRENT_TEACHER
    || CATALOG.teachers.find(t => t.id === app.settings.currentTeacherId)
    || CATALOG.teachers[0];
  let view;
  try { view = applyTeacher(manifest, teacher); } catch (e) { console.warn(e); view = null; }
  const sceneIdx = { i: 0 };

  screen.appendChild(el('div', { class: 'lesson-head' }, [
    teacher.art ? el('img', { class: 't-art-detail', src: teacher.art, alt: teacher.name + ' avatar' }) : null,
    el('h2', { text: lesson.lesson.title }),
    el('p', { class: 'sub', text: (view ? view.teacherName + ' · ' : '') + Math.round(manifest.totalDurationMs / 60000) + ' min' })
  ]));

  const stage = el('div', { class: 'stage' });
  const caption = el('p', { class: 'caption' });
  const fretboard = el('div', { class: 'fretboard' });
  const controls = el('div', { class: 'lesson-controls' });
  const recordStatus = el('div', { class: 'record-status' });

  function paint() {
    const src = view ? view.scenes[sceneIdx.i] : manifest.scenes[sceneIdx.i];
    caption.textContent = (view ? view.scenes[sceneIdx.i].speech.persona_line + ' ' : '') + src.caption;
    fretboard.innerHTML = '';
    if (src.chord && src.chord.frets) {
      fretboard.innerHTML = chordSVG(src.chord);
    } else {
      fretboard.appendChild(el('p', { class: 'muted', text: '—' }));
    }
    controls.querySelector('[data-pos]').textContent = (sceneIdx.i + 1) + ' / ' + (view ? view.scenes.length : manifest.scenes.length);
    // TTS the teacher's line (persona + caption) — never an LLM judgement.
    if (view) speak(view.scenes[sceneIdx.i].speech.persona_line + ' ' + src.caption, { voice: view.voice });
    // In-lesson listening verification (F2 full) when a chord is present and premium.
    recordStatus.textContent = '';
    if (src.chord && src.chord.frets && isPremium()) {
      const verifyBtn = el('button', { class: 'btn small', text: '🎤 Verify this chord', onclick: () => verifyChord(src.chord) });
      controls.appendChild(verifyBtn);
    }
  }

  function verifyChord(chord) {
    recordStatus.textContent = 'Listening… play the chord!';
    const mic = new MicAnalyzer();
    mic.start().then(() => {
      setTimeout(() => {
        const res = mic.verifyChord(chord.frets);
        mic.stop();
        recordStatus.textContent = res.msg;
        recordStatus.className = 'record-status ' + res.verdict;
        // Log to the keystone store (F11/F5/F6 feed).
        if (res.verdict === 'pass' || res.verdict === 'fail') {
          const sid = app.store.startSession(lesson.lesson.id);
          app.store.logAttempt(sid, { chordName: chord.name, frets: chord.frets, verdict: res.verdict });
          app.store.finalizeSession(sid, { completed: true, durationSec: 60 });
          save();
        }
      }, 1600);
    }).catch(e => { recordStatus.textContent = isMicAvailable() ? 'Mic blocked: click the lock icon, allow Microphone, then retry.' : micUnavailableMessage(); });
  }

  controls.appendChild(el('button', { class: 'btn', text: '◀ Back', onclick: () => { sceneIdx.i = Math.max(0, sceneIdx.i - 1); repaint(); } }));
  controls.appendChild(el('button', { class: 'btn primary', text: 'Next ▶', onclick: () => {
    const total = view ? view.scenes.length : manifest.scenes.length;
    if (sceneIdx.i < total - 1) { sceneIdx.i++; repaint(); }
    else {
      // Lesson complete — log the session and determine what's next
      const sid = app.store.startSession(lesson.lesson.id);
      app.store.finalizeSession(sid, { completed: true, durationSec: Math.round(manifest.totalDurationMs / 1000) });
      save();
      const next = planNext(app.store);
      navigate(next.nextRoute || 'progress');
    }
  } }));
  controls.appendChild(el('button', { class: 'btn small', text: '🔊 Replay', onclick: () => { const s = view ? view.scenes[sceneIdx.i] : manifest.scenes[sceneIdx.i]; if (view) speak(s.speech.persona_line + ' ' + s.caption, { voice: view.voice }); } }));
  controls.appendChild(el('span', { class: 'counter', 'data-pos': '' }));

  function repaint() { paint(); }

  // Voice controls (F10) — tap to talk.
  const voiceBtn = el('button', { class: 'btn voice', text: '🗣 Tap to talk', onclick: () => {
    startListening((text) => {
      const ex = V.execute(text, V.defaultAdapter(), { rate: 1, sceneIndex: sceneIdx.i, totalScenes: view ? view.scenes.length : manifest.scenes.length });
      if (ex.intent === 'again') { repaint(); }
      else if (ex.intent === 'whats-next') { if (sceneIdx.i < (view ? view.scenes.length : manifest.scenes.length) - 1) { sceneIdx.i++; repaint(); } }
      else if (ex.intent === 'slower') { caption.textContent = 'Slowing down…'; }
      else if (ex.intent === 'tune') { navigate('tuner'); }
      else if (ex.intent === 'ignore') { recordStatus.textContent = 'I only take lesson commands — try "again", "next", or "slower".'; }
    }, () => { recordStatus.textContent = 'Speech recognition not available on this device.'; });
  }});
  if (isPremium()) controls.appendChild(voiceBtn);

  // Coach surface for asking questions
  let coachSurface = null;
  const coachBtn = el('button', { class: 'btn', text: '💬 Ask teacher', onclick: () => {
    if (!coachSurface) {
      const coachContainer = el('div');
      screen.appendChild(coachContainer);
      coachSurface = createCoachSurface(app.store, teacher.id, coachContainer);
      coachBtn.textContent = '✕ Close';
    } else {
      closeCoachSurface(coachSurface);
      coachSurface = null;
      coachBtn.textContent = '💬 Ask teacher';
    }
  }});
  if (isPremium()) controls.appendChild(coachBtn);

  screen.appendChild(stage); stage.appendChild(caption); stage.appendChild(fretboard); stage.appendChild(recordStatus);
  screen.appendChild(controls);
  paint();
}

function renderTuner() {
  screen.appendChild(el('h2', { text: 'Tuner (free)' }));
  const needle = el('div', { class: 'tuner-needle' });
  const noteLabel = el('div', { class: 'tuner-note', text: '—' });
  const centsLabel = el('div', { class: 'tuner-cents', text: '' });
  const micBtn = el('button', { class: 'btn primary', text: '🎤 Start tuning', onclick: startTuner });
  const stopBtn = el('button', { class: 'btn', text: '■ Stop', onclick: stopTuner });
  screen.appendChild(noteLabel); screen.appendChild(needle); screen.appendChild(centsLabel);
  screen.appendChild(micBtn); screen.appendChild(stopBtn);
  const status = el('p', { class: 'muted', text: 'Tap Start, then play a string.' });
  screen.appendChild(status);
  let mic, raf;
  function stopTuner() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (mic) { try { mic.stop(); } catch (e) {} mic = null; }
    micBtn.disabled = false;
    status.textContent = 'Stopped. Tap Start to tune again.';
  }
  stopActiveTuner = stopTuner;  // let the router tear this down on navigation
  async function startTuner() {
    if (mic) return;
    micBtn.disabled = true;
    status.textContent = 'Requesting microphone…';
    try {
      mic = new MicAnalyzer();
      await mic.start();
    } catch (e) {
      micBtn.disabled = false;
      if (isMicAvailable()) {
        status.textContent = '⚠ Microphone blocked — click the 🎤/lock icon in the address bar, set Microphone to Allow, then Start again.';
      } else if (window.__LAN_HTTPS_DOGFOOD__) {
        // On an insecure http://LAN-IP context: turn the error into a one-tap link
        // to the exact secure URL. The Windows mic toggle is already ON — the browser
        // simply refuses to expose the mic API over plain HTTP on a LAN IP.
        status.innerHTML = '⚠ Mic needs a secure connection. <a href="' + window.__LAN_HTTPS_DOGFOOD__ +
          '">Tap here to open the secure version</a> (then "Advanced → Proceed" once). Your Windows mic toggle is already ON — this is a browser security rule, not that toggle.';
      } else {
        status.textContent = micUnavailableMessage();
      }
      return;
    }
    status.textContent = 'Listening — play a string.';
    const tick = () => {
      const f = mic.detectPitch();
      if (f > 0) {
        const n = T.noteFromFreq(f);
        noteLabel.textContent = n.name;
        const nearest = nearestOpen(f);
        const v = T.tuneVerdict(f, nearest.freq);
        centsLabel.textContent = v.label + '  (vs ' + nearest.name + ': ' + Math.round(v.cents) + '¢)';
        needle.style.transform = 'rotate(' + (Math.max(-50, Math.min(50, v.cents)) * 1.2) + 'deg)';
      } else { noteLabel.textContent = '—'; centsLabel.textContent = ''; }
      raf = requestAnimationFrame(tick);
    };
    tick();
  }
  function nearestOpen(f) {
    let best = T.STRINGS[0], bestD = 1e9;
    for (const s of T.STRINGS) { const d = Math.abs(f - s.freq); if (d < bestD) { bestD = d; best = s; } }
    return best;
  }
}

function renderMetronome() {
  screen.appendChild(el('h2', { text: 'Metronome (free)' }));
  const bpmLabel = el('div', { class: 'bpm', text: '80 BPM' });
  let bpm = 80, playing = false, timer = null, audioCtx = null;
  const slider = el('input', { type: 'range', min: '33', max: '240', value: '80' });
  slider.addEventListener('input', () => { bpm = parseInt(slider.value); bpmLabel.textContent = bpm + ' BPM'; });
  const toggle = el('button', { class: 'btn primary', text: '▶ Start', onclick: () => {
    playing = !playing;
    if (playing) { toggle.textContent = '⏸ Stop'; startClick(); }
    else { toggle.textContent = '▶ Start'; if (timer) clearInterval(timer); }
  }});
  function startClick() {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const beat = () => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 1000; g.gain.value = 0.3; o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + 0.05);
    };
    beat();
    timer = setInterval(beat, 60000 / bpm);
  }
  // close the metronome AudioContext when leaving the screen
  window.addEventListener('beforeunload', () => { if (audioCtx) audioCtx.close(); }, { once: true });
  screen.appendChild(bpmLabel); screen.appendChild(slider); screen.appendChild(toggle);
}

function renderRoster() {
  guardPremium('teacherRoster', () => {
    screen.appendChild(el('h2', { text: 'Your Teachers' }));
    screen.appendChild(el('p', { class: 'sub', text: 'Swap anytime — same lessons, new personality. (Pro feature.)' }));
    const grid = el('div', { class: 'teacher-grid' });
    CATALOG.teachers.forEach(t => {
      const cur = t.id === app.settings.currentTeacherId;
      const card = el('button', { class: 'teacher-card' + (cur ? ' current' : ''), onclick: () => navigate('teacherDetail', { id: t.id }) }, [
        t.art ? el('img', { class: 't-art', src: t.art, alt: t.name + ' avatar' }) : null,
        el('div', { class: 't-name', text: t.name }),
        el('div', { class: 't-tag', text: t.tagline }),
        el('div', { class: 't-style', text: t.teaching_style.slice(0, 90) + '…' }),
        cur ? el('span', { class: 'badge', text: '✓ current' }) : null
      ]);
      grid.appendChild(card);
    });
    screen.appendChild(grid);
  });
}

function renderTeacherDetail(params) {
  const t = CATALOG.teachers.find(x => x.id === params.id);
  if (!t) { renderRoster(); return; }
  if (t.art) screen.appendChild(el('img', { class: 't-art-detail', src: t.art, alt: t.name + ' avatar' }));
  screen.appendChild(el('h2', { text: t.name }));
  screen.appendChild(el('p', { class: 'tag', text: t.tagline }));
  screen.appendChild(el('p', { text: t.teaching_style }));
  screen.appendChild(el('p', { class: 'sub', text: 'Voice: ' + t.voice.provider + ' / ' + t.voice.voice_id }));
  const setBtn = el('button', { class: 'btn primary', text: app.settings.currentTeacherId === t.id ? '✓ This is your teacher' : 'Make this my teacher', onclick: () => {
    const prev = app.settings.currentTeacherId;
    app.settings.currentTeacherId = t.id;
    app.store.setTeacher(t.id);
    CURRENT_TEACHER = t;
    save();
    const handoff = el('div', { class: 'handoff', text: t.handoff_line + (prev !== t.id ? ' (was ' + (CATALOG.teachers.find(x => x.id === prev)?.name || prev) + ')' : '') });
    screen.appendChild(handoff);
    refreshTeacherChip();
    setBtn.textContent = '✓ This is your teacher';
  }});
  screen.appendChild(setBtn);
}

function renderChat() {
  guardPremium('chat', () => {
    screen.appendChild(el('h2', { text: 'Ask ' + (CURRENT_TEACHER?.name || 'your teacher') }));
    const log = el('div', { class: 'chat-log' });
    const input = el('input', { type: 'text', placeholder: 'Ask about chords, buzzing, your next lesson…' });
    const sendBtn = el('button', { class: 'btn', text: 'Send', onclick: () => {
      const text = input.value.trim(); if (!text) return;
      log.appendChild(el('div', { class: 'msg me', text }));
      const r = chatReply(app.store, app.settings.currentTeacherId, text);
      log.appendChild(el('div', { class: 'msg teacher', text: r.text }));
      // Voice the coach reply through the SAME API proxy used by lessons, so the
      // AI teacher speaks in chat too (not just during lesson scenes).
      const tv = (CURRENT_TEACHER || CATALOG.teachers.find(t => t.id === app.settings.currentTeacherId) || CATALOG.teachers[0] || {}).voice;
      if (tv) speak(r.text, { voice: tv });
      log.appendChild(el('button', { class: 'btn small', text: '🔊 Replay', onclick: () => { if (tv) speak(r.text, { voice: tv }); } }));
      input.value = '';
    }});
    const bar = el('div', { class: 'chat-bar' }, [input, sendBtn]);
    screen.appendChild(log); screen.appendChild(bar);
  });
}

function renderPlan() {
  guardPremium('adaptive', () => {
    screen.appendChild(el('h2', { text: 'Your Practice Plan' }));
    screen.appendChild(el('p', { class: 'sub', text: 'Built from your last session — opens with what you struggled with.' }));
    const plan = buildTomorrowPlan(app.store);
      const list = el('div', { class: 'list' });
      plan.plan.forEach(p => {
        list.appendChild(el('div', { class: 'list-item' }, [
          el('span', { text: labelFor(p) }),
          el('span', { class: 'badge', text: p.type })
        ]));
      });
      screen.appendChild(list);
      if (!plan.openedWithDrill) screen.appendChild(el('p', { class: 'muted', text: 'No struggles logged yet — finish a lesson to get a tailored plan.' }));
  });
  function labelFor(p) {
    if (p.type === 'chord-drill') return 'Drill: ' + p.chord;
    if (p.type === 'chord-change-drill') return 'Changes: ' + p.chords.join(' ⇄ ');
    if (p.type === 'rep') return 'Rep: ' + p.chord;
    if (p.type === 'lesson') return 'Lesson: ' + p.lessonId;
    return p.reason;
  }
}

function renderProgress() {
  guardPremium('streaks', () => {
    const r = progressReadout(app.store);
    screen.appendChild(el('h2', { text: 'Your Progress' }));
    const stats = el('div', { class: 'stat-grid' });
    [['🔥 Streak', r.currentStreak + ' days'], ['🏆 Longest', r.longestStreak + ' days'],
     ['⏱ Practice', r.practiceMinutes + ' min'], ['📚 Lessons', r.lessonsCompleted],
     ['✅ Clean chords', r.cleanChords.length], ['💪 Struggling', r.strugglingChords.length]].forEach(([k, v]) => {
      stats.appendChild(el('div', { class: 'stat' }, [el('div', { class: 'stat-v', text: v }), el('div', { class: 'stat-k', text: k })]));
    });
    screen.appendChild(stats);
    if (r.cleanChords.length) screen.appendChild(el('p', { text: 'Clean: ' + r.cleanChords.join(', ') }));
    if (r.strugglingChords.length) screen.appendChild(el('p', { text: 'Needs work: ' + r.strugglingChords.join(', ') }));
  });
}

function renderBand() {
  guardPremium('band', () => {
    screen.appendChild(el('h2', { text: 'The Band That Follows You' }));
    screen.appendChild(el('p', { class: 'sub', text: 'A patient backing track in the tempo you actually played at. Original audio, synthesized on-device.' }));
    // Pick a chord cycle from a lesson or default.
    const opts = { chordCycle: ['Em', 'A', 'D'], chords: {
      Em: { frets: [0,2,2,0,0,0] }, A: { frets: [null,0,2,2,2,0] }, D: { frets: [null,null,0,2,3,2] }
    }, bpm: app.store.lastPracticeTempo() || 80, beats: 4, bars: 4, seed: 1 };
    const playBtn = el('button', { class: 'btn primary', text: '▶ Play band at ' + opts.bpm + ' BPM', onclick: async () => {
      playBtn.disabled = true; playBtn.textContent = 'Generating…';
      const band = B.buildBand(opts);
      playBtn.textContent = 'Playing…';
      await playBuffer(band.buffer, band.sampleRate);
      playBtn.textContent = '▶ Play again'; playBtn.disabled = false;
    }});
    screen.appendChild(playBtn);
    screen.appendChild(el('p', { class: 'muted', text: 'Loop: Em → A → D. The band adopts your last-practice tempo so it never snaps to a fixed click.' }));
  });
}

function renderPractice() {
  guardPremium('practice', async () => {
    // Load the practice index to get available pairs
    try {
      const practiceIndex = await loadJson('./content/practice/index.json');
      const knownPairs = practiceIndex.pairs.map(p => [p.a, p.b]);
      const fluencyStore = createFluencyStore({ knownPairs, now: () => Date.now() });

      screen.appendChild(el('h2', { text: 'Practice — 1-minute chord changes' }));
      screen.appendChild(el('p', { class: 'sub', text: 'The 30/60 engine measures clean changes/min and remembers your weak chord pairs for spaced review.' }));

      // Pair selector
      const pairSelector = el('select');
      practiceIndex.pairs.forEach((p, i) => {
        const opt = el('option', { text: `${p.a} ↔ ${p.b}` });
        opt.value = i;
        pairSelector.appendChild(opt);
      });

      // Run drill button
      const runBtn = el('button', { class: 'btn primary', text: '▶ Run 1-minute drill', onclick: () => {
        const pairIdx = +pairSelector.value;
        const p = practiceIndex.pairs[pairIdx];
        // Simulate drill (no real listener yet)
        const baseSkill = { Em:0.98, easyC:0.9, C:0.9, G:0.8, D:0.6, A:0.7, Am:0.5, E:0.75, Dm:0.4 };
        const skill = Math.min(baseSkill[p.a] ?? 0.7, baseSkill[p.b] ?? 0.7);
        const seed = Math.max(1, pairIdx);
        const simulatedEvents = simulateDrill(p.a, p.b, skill, seed);
        const result = measureOneMinute([p.a, p.b], simulatedEvents);
        fluencyStore.record(pairKey(p.a, p.b), { ratePerMin: result.ratePerMin });
        renderDrillResult(result, p);
      }});

      // Weak pair review button
      const reviewBtn = el('button', { class: 'btn', text: '📋 Build weak-pair review (K=3)' });
      reviewBtn.onclick = () => {
        const weak = fluencyStore.selectWeakest(3);
        if (!weak.length) {
          alert('No weak pairs yet — run some drills!');
          return;
        }
        renderWeakPairs(weak, fluencyStore);
      };

      const card1 = el('div', { class: 'card' }, [
        el('label', { text: 'Pick a chord pair to drill' }),
        pairSelector,
        el('div', { class: 'row', style: 'margin-top: 12px' }, [runBtn, reviewBtn])
      ]);
      screen.appendChild(card1);

      // Result card
      const resultCard = el('div', { class: 'card', id: 'drillResult' });
      screen.appendChild(resultCard);

      // Weak pairs card
      const weakCard = el('div', { class: 'card', id: 'weakPairs' });
      screen.appendChild(weakCard);
      renderWeakPairs(fluencyStore.selectWeakest(8), fluencyStore);

      // Info card
      const infoCard = el('div', { class: 'card' }, [
        el('label', { text: 'All practice pairs generated from the 20-lesson spine' }),
        el('p', { class: 'muted', text: `${practiceIndex.pairs.length} pairs across the curriculum ladder.` })
      ]);
      screen.appendChild(infoCard);

      function renderDrillResult(result, pair) {
        const card = document.getElementById('drillResult');
        card.innerHTML = '';
        card.appendChild(el('div', { class: 'stat' }, [
          el('span', { text: 'Last drill rate' }),
          el('span', { class: 'big', text: result.ratePerMin })
        ]));
        const pill = el('span', { class: 'pill' + (result.goal ? ' goal' : result.advance ? ' advance' : ' weak') });
        pill.textContent = result.goal ? 'GOAL: 60/min reached' : result.advance ? 'ADVANCE: 30+/min' : 'keep practicing';
        card.appendChild(pill);
        const verdict = el('div', { class: 'verdict' });
        verdict.innerHTML = result.advance
          ? '<span style="color:var(--good)">Clean changes counted. Rate logged to fluency memory.</span>'
          : '<span style="color:var(--bad)">Below 30/min — logged so this pair resurfaces in review.</span>';
        card.appendChild(verdict);
      }

      function renderWeakPairs(weak, store) {
        const card = document.getElementById('weakPairs');
        card.innerHTML = '<label style="display:block; color:var(--mut); font-size:13px; margin:0 0 10px">Weakest pairs in memory (adaptive review queue)</label>';
        const list = el('ul', { class: 'queue' });
        if (!weak.length) {
          list.appendChild(el('li', { text: 'Run drills to populate memory.' }));
        } else {
          weak.forEach(w => {
            const flu = Math.round((w.fluency ?? 0) * 100);
            const tag = flu < 35 ? 'weak' : flu < 70 ? '' : 'advance';
            const li = el('li', { class: 'queue' }, [
              el('span', { text: w.pair }),
              el('span', { class: 'pill ' + tag, text: `fluency ${flu}%` })
            ]);
            list.appendChild(li);
          });
        }
        card.appendChild(list);
      }

      function simulateDrill(X, old, skill, seed) {
        let s = seed * 9301 + 49297;
        const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
        const events = [];
        let t = 0;
        const N = Math.round(60 * (30 + skill * 35));
        for (let i = 0; i < N; i++) {
          t += 1000;
          const flip = rnd() < 0.5;
          const next = flip ? X : old;
          const confident = rnd() < (0.55 + skill * 0.4);
          events.push({ chord: next, confident, t });
        }
        return events;
      }
    } catch (e) {
      console.error('Practice load failed:', e);
      screen.appendChild(el('p', { text: 'Error loading practice content.' }));
    }
  });
}

function renderPacks(params) {
  const pack = CATALOG.packs.find(p => p.id === params.packId);
  if (!pack) {
    screen.appendChild(el('h2', { text: 'Style Packs' }));
    const grid = el('div', { class: 'list' });
    CATALOG.packs.forEach(p => grid.appendChild(el('button', { class: 'list-item' + (isPremium() ? '' : ' locked'), text: p.name + (isPremium() ? '' : ' 🔒 Pro'), onclick: () => { if (!isPremium()) renderPaywall('stylePacks'); else navigate('packs', { packId: p.id }); } })));
    screen.appendChild(grid);
    return;
  }
  guardPremium('stylePacks', () => {
    screen.appendChild(el('h2', { text: pack.name }));
    const list = el('div', { class: 'list' });
    pack.lessons.forEach(l => {
      const item = el('button', { class: 'list-item', text: l.title });
      item.addEventListener('click', () => {
        loadJson(l.path).then(raw => navigate('lesson', {
          id: raw.lesson.id, path: l.path, raw,
          // F2/F3: open the lesson with the pack's own guest teacher (e.g. Roscoe for Blues).
          packTeacherId: pack.teacher ? pack.teacher.id : undefined
        }));
      });
      list.appendChild(item);
    });
    screen.appendChild(list);
  });
}

function renderUpgrade() {
  screen.appendChild(el('div', { class: 'upgrade' }, [
    el('h2', { text: 'Go Pro — $12/month' }),
    el('p', { class: 'sub', text: 'Unlock all 20 lessons, every teacher, the band, voice controls, practice plan and progress.' }),
    el('div', { class: 'price', text: '$12 / month · cancel anytime' }),
    el('button', { class: 'btn primary big', text: isPremium() ? '✓ You are Pro' : 'Start 7-day free trial', onclick: () => {
      if (!isPremium()) { app.startFreeTrial(); save(); }
      renderUpgrade();
    }}),
    el('button', { class: 'btn', text: 'Restore / Simulate purchase (sandbox)', onclick: () => {
      app.purchase().then(() => { renderUpgrade(); });
    }})
  ]));
  if (isPremium()) screen.appendChild(el('p', { class: 'muted', text: 'Free tier stays: tuner + metronome + Lesson 1.' }));
}

function renderPaywall(feature) {
  screen.innerHTML = '';
  screen.appendChild(el('div', { class: 'paywall' }, [
    el('h2', { text: '🔒 Pro feature' }),
    el('p', { class: 'sub', text: 'This is part of GuitarApp Pro ($12/month). The free tier includes the tuner, metronome, and Lesson 1.' }),
    el('button', { class: 'btn primary big', text: 'Start free trial', onclick: () => { app.startFreeTrial(); save(); navigate('upgrade'); } }),
    el('button', { class: 'btn', text: '← Back', onclick: () => navigate('home') })
  ]));
}

// ---------- fatal error screen ----------
// User-visible safety net: if boot ever fails (stale cache, missing module, JSON
// error) the phone shows a real message + the fix, never a blank white screen.
function showFatal(msg) {
  const screen = document.getElementById('screen');
  if (!screen) return;
  screen.innerHTML = '';
  screen.appendChild(el('div', { class: 'fatal' }, [
    el('h2', { text: "The app couldn't open" }),
    el('p', { text: String(msg || 'Unknown error') }),
    el('p', { class: 'fatal-fix', html: 'Fix: close this tab and re-open the full link Heidi gave you (it ends in <code>?dogfood=1</code>). If that still fails, ask Heidi to restart <code>start-lan.bat</code> on her computer.' }),
  ]));
}

// ---------- boot ----------
async function boot() {
  // Never let the app silently white-screen. If any module fails to load or a
  // boot error is thrown, show a real message (with the fix) instead of a blank
  // page. This is the user-visible safety net for "app won't open after a change."
  window.addEventListener('error', (ev) => { showFatal(ev.message || 'Load error'); });
  window.addEventListener('unhandledrejection', (ev) => { showFatal((ev.reason && (ev.reason.message || ev.reason)) || 'Load error'); });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(e => console.warn('SW register failed', e));
  }
  try {
    CATALOG.lessons = await loadCoreLessons();
    CATALOG.packs = await loadPacks();
    CATALOG.teachers = await loadTeachers();
    // F2: Guest pack teachers (e.g. Roscoe/T4 for the Blues pack) live in the pack
    // layer, not content/teachers/. Fold them into the global roster so the roster,
    // teacher chip, and applyTeacher all see them — without moving files.
    // A pack teacher is injected once (deduped by id).
    for (const pack of CATALOG.packs) {
      if (pack.teacher && !CATALOG.teachers.some(t => t.id === pack.teacher.id)) {
        CATALOG.teachers.push(pack.teacher);
      }
    }
    CATALOG.teachers.sort((a, b) => a.id.localeCompare(b.id));
    CURRENT_TEACHER = CATALOG.teachers.find(t => t.id === app.settings.currentTeacherId) || CATALOG.teachers[0];
    app.entitlement.settleTrial();
    save();
  } catch (e) { console.error('catalog load failed', e); showFatal('Content failed to load: ' + (e && e.message)); return; }
  // LOCAL dogfood unlock (labeled, opt-in via ?dogfood=1). Production paywall untouched.
  const _p = new URLSearchParams(location.search);
  if (_p.get('dogfood') === '1') setDogfood(true);
  app.dogfood = isDogfood();
  refreshTeacherChip();
  navigate('home');
  // expose for hostile verification harness (browser)
  window.__APP__ = { app, CATALOG, navigate, buildManifest };
}
boot();
