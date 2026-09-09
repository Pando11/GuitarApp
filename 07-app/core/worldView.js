// worldView.js — Emerald Hollow, in the app.
//
// The world was built in Godot (07-app/godot/) and never reached a student:
// ADR-0005 shipped the web app and the world as two separate things, so the
// lesson happened in a grid of buttons and Emerald Hollow happened in an editor
// on one machine. This is the same world — the same cold-open clips, the same
// porch, the same doors World.gd builds — rendered by the app that owns the
// lessons, so walking through a door opens the real lesson, with Sage's chat
// and the tuner attached.
//
// What is deliberately the same as World.gd:
//   - the cold open plays first, once, then the entry screen appears
//   - the entry screen is the porch backdrop plus one door per lesson
//   - a door calls into the lesson by id; the world does not own lesson content
//
// What is deliberately different: the doors here open the app's real lessons
// rather than a placeholder scene, and a lesson that has no generated video
// simply is the app's lesson screen instead of a still with an overlay.

const WORLD_ID = 'emerald-hollow';
const ASSETS = './assets/worlds/' + WORLD_ID + '/';

// The cold open, in order. Mirrors lesson_manifest.json's "W1-coldopen" clips
// block; the captions are the exact lines in the world's own voice manifest,
// so nothing here is newly written dialogue.
// The clips carry no audio of their own — Wan2.2 image-to-video produces
// silent footage, and Sage's lines were generated separately as Chatterbox
// voice files. `voice` names the line to play over the clip, which is the
// pairing lesson_manifest.json's voice_assets block already describes; without
// it Sage moves his mouth and says nothing.
const COLD_OPEN = [
  { file: 'B00_walkin.mp4', caption: '', voice: null },
  {
    file: 'B01_meetsage.mp4',
    caption: "Hey, you made it. Grab a seat on the porch, and let's play.",
    voice: { adult: 'B01_welcome_adult.wav', kid: 'B01_welcome_kid.wav' },
  },
  {
    file: 'B02_twoshot.mp4',
    caption: "There it is. That's your first chord. You've got this.",
    // Only an adult register was generated for this line; the kid register
    // falls back to it rather than going silent.
    voice: { adult: 'B02_youvegotthis.wav' },
  },
];

// Set once the student has seen the arrival. The cold open is a first-visit
// beat, not something to sit through on every load; "Watch the arrival again"
// on the porch replays it on demand.
const SEEN_KEY = 'guitarapp.world.coldOpenSeen.v1';

function el(id) {
  return document.getElementById(id);
}

function seenColdOpen() {
  try { return !!localStorage.getItem(SEEN_KEY); } catch (e) { return false; }
}

function markColdOpenSeen() {
  try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* non-fatal */ }
}

// --- cold open -------------------------------------------------------------

const coldOpen = { index: 0, running: false };

// Which recorded register to use for Sage. Reads the stored learner profile
// rather than asking again; an under-13 band gets the line recorded for a
// child. Never guesses a register that wasn't recorded — see the fallback in
// voiceFileFor.
function preferredRegister() {
  try {
    const profile = (window.GuitarApp && typeof window.GuitarApp.getLearnerProfile === 'function')
      ? window.GuitarApp.getLearnerProfile()
      : null;
    return (profile && profile.ageBand === 'under-13') ? 'kid' : 'adult';
  } catch (e) {
    return 'adult';
  }
}

function voiceFileFor(entry) {
  if (!entry || !entry.voice) return null;
  return entry.voice[preferredRegister()] || entry.voice.adult || null;
}

function stopVoice() {
  const voice = el('world-voice');
  if (!voice) return;
  try { voice.pause(); } catch (e) { /* already stopped */ }
  voice.removeAttribute('src');
  try { voice.load(); } catch (e) { /* already torn down */ }
}

function stopColdOpen() {
  coldOpen.running = false;
  const video = el('world-clip');
  if (video) {
    try { video.pause(); } catch (e) { /* already stopped */ }
    video.removeAttribute('src');
    try { video.load(); } catch (e) { /* already torn down */ }
  }
  stopVoice();
  const stage = el('world-coldopen');
  if (stage) stage.hidden = true;
}

function playClip(step) {
  const video = el('world-clip');
  const caption = el('world-caption');
  if (!video) return finishColdOpen();

  const entry = COLD_OPEN[step];
  if (!entry) return finishColdOpen();

  if (caption) caption.textContent = entry.caption;

  stopVoice();
  const voiceFile = voiceFileFor(entry);
  const voice = el('world-voice');
  if (voice && voiceFile) {
    voice.src = ASSETS + 'voice/' + voiceFile;
    const spoken = voice.play();
    if (spoken && typeof spoken.catch === 'function') {
      // A refused voice track must never stop the walk-in: the caption is
      // already on screen carrying the same line.
      spoken.catch(function () { /* caption stands in */ });
    }
  }

  video.src = ASSETS + 'clips/' + entry.file;
  const attempt = video.play();
  if (attempt && typeof attempt.catch === 'function') {
    // Autoplay can be refused (a browser that wants a gesture first, or a data
    // saver). Don't strand the student on a black frame — go straight to the
    // porch, which is where the cold open was taking them anyway.
    attempt.catch(function () { finishColdOpen(); });
  }
}

function nextClip() {
  if (!coldOpen.running) return;
  coldOpen.index += 1;
  if (coldOpen.index >= COLD_OPEN.length) return finishColdOpen();
  playClip(coldOpen.index);
}

function finishColdOpen() {
  if (!coldOpen.running) return;
  markColdOpenSeen();
  stopColdOpen();
  showPorch();
}

export function playColdOpen() {
  const stage = el('world-coldopen');
  const porch = el('world-porch');
  if (!stage) return showPorch();
  coldOpen.index = 0;
  coldOpen.running = true;
  if (porch) porch.hidden = true;
  stage.hidden = false;
  playClip(0);
}

// --- the porch -------------------------------------------------------------

function showPorch() {
  const porch = el('world-porch');
  const stage = el('world-coldopen');
  if (stage) stage.hidden = true;
  if (porch) porch.hidden = false;
}

// One door per unlocked lesson. The world does not decide what is unlocked or
// what a lesson contains — it asks the shell, which owns both.
function renderDoors() {
  const list = el('world-doors');
  if (!list) return;
  const shell = window.GuitarApp && window.GuitarApp.WorldBridge;
  const doors = (shell && typeof shell.listDoors === 'function') ? shell.listDoors() : [];
  list.textContent = '';

  if (!doors.length) {
    const waiting = document.createElement('p');
    waiting.className = 'meta';
    waiting.textContent = 'The path is still lighting up…';
    list.appendChild(waiting);
    return;
  }

  for (const door of doors) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'world-door';
    button.disabled = !door.unlocked;

    const number = document.createElement('span');
    number.className = 'lesson-number';
    number.textContent = door.label;
    button.appendChild(number);

    const title = document.createElement('span');
    title.className = 'world-door-title';
    title.textContent = door.title;
    button.appendChild(title);

    const state = document.createElement('span');
    state.className = 'meta';
    state.textContent = door.unlocked
      ? (door.completed ? 'Walked this one' : 'Open')
      : 'Further down the path';
    button.appendChild(state);

    if (door.unlocked) {
      button.addEventListener('click', function () {
        if (shell && typeof shell.enterLesson === 'function') shell.enterLesson(door.index);
      });
    }
    list.appendChild(button);
  }
}

// --- view wiring -----------------------------------------------------------

export function openWorldView(options) {
  const opts = options || {};
  const world = el('world-view');
  const home = el('home-view');
  if (!world) return;
  if (home) home.hidden = true;
  world.hidden = false;
  renderDoors();
  window.scrollTo(0, 0);

  if (opts.replayColdOpen || !seenColdOpen()) {
    playColdOpen();
  } else {
    showPorch();
  }
}

export function closeWorldView() {
  // Always stop the clip on the way out: a <video> left playing behind a
  // hidden section keeps its audio going over whatever the student opened.
  stopColdOpen();
  const world = el('world-view');
  const home = el('home-view');
  if (world) world.hidden = true;
  if (home) home.hidden = false;
  window.scrollTo(0, 0);
}

// Called by the shell when it takes over the screen (a lesson opening), so the
// world lets go of the audio and the DOM without also un-hiding the home view.
export function suspendWorldView() {
  stopColdOpen();
  const world = el('world-view');
  if (world) world.hidden = true;
}

export function mountWorldView() {
  const enter = el('start-world');
  const leave = el('world-back-home');
  const skip = el('world-skip-coldopen');
  const replay = el('world-replay-coldopen');
  const video = el('world-clip');

  if (enter) enter.addEventListener('click', function () { openWorldView(); });
  if (leave) leave.addEventListener('click', closeWorldView);
  if (skip) skip.addEventListener('click', finishColdOpen);
  if (replay) replay.addEventListener('click', function () { openWorldView({ replayColdOpen: true }); });
  if (video) {
    video.addEventListener('ended', nextClip);
    // A clip that fails to load must not end the walk-in — move along to the
    // next one, and the sequence still lands on the porch.
    video.addEventListener('error', nextClip);
  }

  // Doors are built from the lesson catalog, which loads after this runs.
  window.addEventListener('guitarapp:lessons-loaded', renderDoors);
  // Completing a lesson changes a door's state; redraw so returning to the
  // world shows it.
  window.addEventListener('guitarapp:lesson-completed', renderDoors);
}

if (typeof window !== 'undefined') {
  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.WorldView = {
    mountWorldView,
    openWorldView,
    closeWorldView,
    suspendWorldView,
    playColdOpen,
    renderDoors,
    WORLD_ID,
  };
}

export default { mountWorldView, openWorldView, closeWorldView, suspendWorldView, playColdOpen, renderDoors, WORLD_ID };
