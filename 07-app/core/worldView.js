// worldView.js — Emerald Hollow, in the app.
//
// Emerald Hollow is the cinematic the student sees when they open the app: a
// short, camera-driven arrival that comes to rest on Sage, then hands off to
// the lesson. It is NOT a player-controlled world — there is no movement, no
// collision, no walkable level, and no button-grid "menu" competing with the
// cinematic for attention. That whole direction (a Godot-style explorable
// porch with a door per lesson) is out of scope; see the header comment this
// file used to carry for the earlier shape, and docs/adr/0005 for how this
// got here.
//
// The clips and stills below are the same assets the cold open always used
// (07-app/assets/worlds/emerald-hollow/). This rebuild does not add new art —
// it re-sequences what already exists into one continuous arrival:
//   walk-in clip -> meet Sage clip -> a still beat -> the chord clip
//   -> rest on Sage's porch portrait, where Sage speaks the one line that was
//   generated but never used (sage_welcome.wav), and the arrival holds there
//   until it hands off.
//
// Every session plays the full arrival (there is no "seen it once" gate
// anymore) — so it is built to be short enough and skippable enough that a
// returning student doesn't mind it: a "Skip to lesson" control is visible
// and live for the entire run, not just at the end.
//
// COMPLETION HOOK (read this before wiring a lesson transition elsewhere):
//   playArrival() returns a Promise<void> that resolves exactly once, either
//   when the sequence finishes on its own or the instant the student clicks
//   "Skip to lesson". onArrivalComplete(callback) registers a callback fired
//   at the same moment (and returns an unsubscribe function). Neither one
//   navigates anywhere — this module does not know what the lesson route is.
//   A caller elsewhere hooks up the actual transition, e.g.:
//
//     import { playArrival, onArrivalComplete } from './core/worldView.js';
//     onArrivalComplete(() => shell.enterLesson(nextLessonIndex));
//     // or: playArrival().then(() => shell.enterLesson(nextLessonIndex));
//
//   By the time the hook fires, this module has already stopped every clip,
//   voice line, and (if one is ever added — see MUSIC_TRACK below) music
//   track, so the lesson that follows starts in silence rather than with
//   arrival audio bleeding into it. suspendWorldView() (unchanged from
//   before) remains the way an external caller tells this module to let go
//   of the screen once it takes over.

const WORLD_ID = 'emerald-hollow';
const ASSETS = './assets/worlds/' + WORLD_ID + '/';

// A short crossfade-through-black between beats. Applies to every transition
// (video-to-video, video-to-still, still-to-still) so the sequence reads as
// one continuous camera move rather than a slideshow with hard cuts.
const TRANSITION_MS = 700;

// No ambient music asset exists in 07-app/assets/worlds/emerald-hollow today
// (checked: clips/, stills/, voice/ — voice/ holds Sage's dialogue lines
// only, nothing ambient or instrumental). The ticket that produced this file
// says not to generate new art/audio, so MUSIC_TRACK stays unset and
// startMusic()/fadeOutMusic() below are no-ops until a real bed is added.
// When one exists, set this to its filename relative to ASSETS + 'music/'
// (or wherever it lands) and the fade-to-silence on the rest beat will pick
// it up automatically — nothing else about the sequence needs to change.
const MUSIC_TRACK = null;
const MUSIC_FADE_MS = 2500;

// The arrival, in order. `type` is 'video' (an existing silent clip, camera
// motion baked in), 'still' (a bridge beat — a plain hold with a slow
// Ken Burns drift, since only a still exists for it), or 'rest' (the still
// the arrival ends on: Sage's porch portrait, held long enough to read as
// "arriving", then handing off). `rate` slows video playback so the existing
// ~5s clips read as unhurried camera moves rather than a quick cut. Captions
// and voice lines are exactly the dialogue already recorded for this world
// (see voice/manifest.json) — nothing here is newly written.
const ARRIVAL_SEQUENCE = [
  {
    type: 'video',
    file: 'B00_walkin.mp4',
    rate: 0.6,
    caption: '',
    voice: null,
  },
  {
    type: 'video',
    file: 'B01_meetsage.mp4',
    rate: 0.6,
    caption: "Hey, you made it. Grab a seat on the porch, and let's play.",
    voice: { adult: 'B01_welcome_adult.wav', kid: 'B01_welcome_kid.wav' },
  },
  {
    type: 'still',
    file: 'twoshot.png',
    hold: 4500,
    caption: '',
    voice: null,
  },
  {
    type: 'video',
    file: 'B02_twoshot.mp4',
    rate: 0.6,
    caption: "There it is. That's your first chord. You've got this.",
    // Only an adult register was generated for this line; the kid register
    // falls back to it rather than going silent.
    voice: { adult: 'B02_youvegotthis.wav' },
  },
  {
    type: 'rest',
    file: 'sage_porch.png',
    hold: 42000,
    caption: "Glad you're here. Take a breath, and let's make some music together.",
    voice: { adult: 'sage_welcome.wav' },
  },
];

function el(id) {
  return document.getElementById(id);
}

// --- learner register (unchanged behavior from the old cold open) ---------

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

// --- one-time DOM/style setup -----------------------------------------------
//
// index.html is not edited by this module — it already declares the stage
// (#world-coldopen with #world-clip, #world-voice, #world-caption and the
// #world-skip-coldopen button). This function only adds what plain markup
// can't express (the still-image layer, the crossfade veil, the Ken Burns
// keyframes) at runtime, the same way any script augments its own DOM.

let styled = false;

function ensureStyles() {
  if (styled) return;
  styled = true;
  const style = document.createElement('style');
  style.id = 'world-arrival-style';
  style.textContent = [
    '.world-arrival-still{width:100%;max-width:960px;border-radius:16px;',
    'background:#0b110d;aspect-ratio:16/9;object-fit:cover;display:block}',
    '.world-arrival-veil{position:absolute;inset:0;background:#05080a;',
    'opacity:0;pointer-events:none;transition:opacity ' + TRANSITION_MS + 'ms ease;',
    'border-radius:16px}',
    '.world-arrival-stagewrap{position:relative;width:100%;max-width:960px;margin:0 auto}',
    '@keyframes world-arrival-kenburns{from{transform:scale(1)}to{transform:scale(1.08)}}',
    '.world-arrival-kenburns{animation-name:world-arrival-kenburns;',
    'animation-timing-function:linear;animation-fill-mode:forwards}',
    '.world-arrival-skip{position:sticky;bottom:0;align-self:center}',
  ].join('');
  document.head.appendChild(style);
}

// Lazily builds the still-image layer and the crossfade veil inside the
// existing #world-coldopen stage, once, the first time the arrival plays.
let stageEls = null;

function ensureStageEls() {
  if (stageEls) return stageEls;
  const stage = el('world-coldopen');
  const video = el('world-clip');
  if (!stage || !video) return null;

  const wrap = document.createElement('div');
  wrap.className = 'world-arrival-stagewrap';
  stage.insertBefore(wrap, video);
  wrap.appendChild(video);

  const still = document.createElement('img');
  still.className = 'world-arrival-still';
  still.alt = '';
  still.hidden = true;
  still.style.position = 'absolute';
  still.style.inset = '0';
  wrap.appendChild(still);

  const veil = document.createElement('div');
  veil.className = 'world-arrival-veil';
  wrap.appendChild(veil);

  video.style.position = 'relative';

  stageEls = { wrap, still, veil };
  return stageEls;
}

// --- playback state ----------------------------------------------------------

const state = {
  index: -1,
  running: false,
  finished: false,
  timer: null,
};

const listeners = [];
let pendingResolvers = [];

export function onArrivalComplete(callback) {
  if (typeof callback !== 'function') return function () {};
  listeners.push(callback);
  return function unsubscribe() {
    const at = listeners.indexOf(callback);
    if (at !== -1) listeners.splice(at, 1);
  };
}

// --- audio: voice lines and (future) music ----------------------------------

function stopVoice() {
  const voice = el('world-voice');
  if (!voice) return;
  try { voice.pause(); } catch (e) { /* already stopped */ }
  voice.removeAttribute('src');
  try { voice.load(); } catch (e) { /* already torn down */ }
}

function playVoice(entry) {
  stopVoice();
  const file = voiceFileFor(entry);
  const voice = el('world-voice');
  if (!voice || !file) return;
  voice.src = ASSETS + 'voice/' + file;
  const attempt = voice.play();
  if (attempt && typeof attempt.catch === 'function') {
    // A refused voice track must never stop the arrival: the caption already
    // on screen carries the same line.
    attempt.catch(function () { /* caption stands in */ });
  }
}

let musicEl = null;
let musicFadeTimer = null;

function startMusic() {
  if (!MUSIC_TRACK) return; // no ambient bed shipped yet — see MUSIC_TRACK above
  if (!musicEl) {
    musicEl = new Audio(ASSETS + 'music/' + MUSIC_TRACK);
    musicEl.loop = true;
  }
  musicEl.volume = 0.6;
  const attempt = musicEl.play();
  if (attempt && typeof attempt.catch === 'function') attempt.catch(function () {});
}

// Ramps music to silence over `ms`, then stops it, so the lesson that
// follows never inherits arrival audio. Safe to call even when no music
// track is configured or playing — it just does nothing.
function fadeOutMusic(ms) {
  if (musicFadeTimer) { clearInterval(musicFadeTimer); musicFadeTimer = null; }
  if (!musicEl) return;
  const duration = ms || MUSIC_FADE_MS;
  const startVolume = musicEl.volume;
  const startedAt = Date.now();
  musicFadeTimer = setInterval(function () {
    const elapsed = Date.now() - startedAt;
    const t = Math.min(1, elapsed / duration);
    musicEl.volume = Math.max(0, startVolume * (1 - t));
    if (t >= 1) {
      clearInterval(musicFadeTimer);
      musicFadeTimer = null;
      try { musicEl.pause(); } catch (e) { /* already stopped */ }
    }
  }, 50);
}

function stopMusicImmediately() {
  if (musicFadeTimer) { clearInterval(musicFadeTimer); musicFadeTimer = null; }
  if (musicEl) {
    try { musicEl.pause(); } catch (e) { /* already stopped */ }
  }
}

// --- the sequence itself ------------------------------------------------------

function clearTimer() {
  if (state.timer) { clearTimeout(state.timer); state.timer = null; }
}

// Fades the crossfade veil to opaque, runs `swap` while the screen is
// covered, then fades the veil back out. `swap` is synchronous.
function crossfade(swap) {
  const stage = ensureStageEls();
  if (!stage) { swap(); return; }
  stage.veil.style.opacity = '1';
  window.setTimeout(function () {
    swap();
    window.setTimeout(function () {
      stage.veil.style.opacity = '0';
    }, 20);
  }, TRANSITION_MS);
}

function showVideoLayer() {
  const stage = ensureStageEls();
  const video = el('world-clip');
  if (stage) stage.still.hidden = true;
  if (video) video.hidden = false;
}

function showStillLayer(file, holdMs) {
  const stage = ensureStageEls();
  const video = el('world-clip');
  if (video) {
    try { video.pause(); } catch (e) { /* already stopped */ }
    video.hidden = true;
  }
  if (!stage) return;
  const still = stage.still;
  still.classList.remove('world-arrival-kenburns');
  // Force reflow so re-adding the animation class restarts it for this beat.
  // eslint-disable-next-line no-unused-expressions
  still.offsetWidth;
  still.src = ASSETS + 'stills/' + file;
  still.hidden = false;
  still.style.animationDuration = Math.max(1000, holdMs + TRANSITION_MS) + 'ms';
  still.classList.add('world-arrival-kenburns');
}

function playStep(index) {
  if (!state.running) return;
  const entry = ARRIVAL_SEQUENCE[index];
  if (!entry) return finishArrival();

  state.index = index;
  const caption = el('world-caption');
  if (caption) caption.textContent = entry.caption || '';

  crossfade(function () {
    playVoice(entry);

    if (entry.type === 'video') {
      showVideoLayer();
      const video = el('world-clip');
      if (!video) return advance();
      video.playbackRate = entry.rate || 1;
      video.src = ASSETS + 'clips/' + entry.file;
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        // Autoplay refused: don't strand the student on a black frame, move
        // the arrival along.
        attempt.catch(function () { advance(); });
      }
      return;
    }

    // 'still' and 'rest' beats: hold, then advance (or finish, for 'rest').
    showStillLayer(entry.file, entry.hold);
    if (entry.type === 'rest') {
      // The rest beat is where the arrival "comes to rest on Sage" — fade
      // any music to silence here, not at the very end, so silence has
      // already settled by the time the student can act.
      fadeOutMusic(MUSIC_FADE_MS);
    }
    clearTimer();
    state.timer = window.setTimeout(function () {
      if (entry.type === 'rest') finishArrival();
      else advance();
    }, entry.hold);
  });
}

function advance() {
  if (!state.running) return;
  clearTimer();
  playStep(state.index + 1);
}

// video 'ended'/'error' -> next step. Only relevant while a video step is the
// active one; harmless no-op otherwise since playStep guards on state.running.
function onClipBoundary() {
  if (!state.running) return;
  const entry = ARRIVAL_SEQUENCE[state.index];
  if (!entry || entry.type !== 'video') return;
  advance();
}

function stopEverythingVisual() {
  clearTimer();
  const video = el('world-clip');
  if (video) {
    try { video.pause(); } catch (e) { /* already stopped */ }
    video.removeAttribute('src');
    try { video.load(); } catch (e) { /* already torn down */ }
  }
  stopVoice();
  const stage = ensureStageEls();
  if (stage) stage.veil.style.opacity = '0';
}

// Ends the arrival: reachable at any time via the always-visible "Skip to
// lesson" control, or fired automatically once the rest beat's hold elapses.
// Idempotent — only the first call does anything.
function finishArrival() {
  if (state.finished) return;
  state.finished = true;
  state.running = false;
  stopEverythingVisual();
  stopMusicImmediately(); // guarantee silence even if the fade hasn't finished
  const callbacks = listeners.slice();
  for (const cb of callbacks) {
    try { cb(); } catch (e) { /* a broken listener must not break the others */ }
  }
  const resolvers = pendingResolvers;
  pendingResolvers = [];
  for (const resolve of resolvers) resolve();
}

// Starts (or restarts) the full arrival cinematic. Internal — playArrival()
// is the public entry point and also returns the completion Promise.
function beginArrival() {
  state.finished = false;
  state.running = true;
  state.index = -1;
  ensureStyles();
  ensureStageEls();
  const stage = el('world-coldopen');
  const porch = el('world-porch');
  if (porch) porch.hidden = true;
  if (stage) stage.hidden = false;
  startMusic();
  playStep(0);
}

/**
 * Plays the full arrival cinematic and resolves once it completes — either
 * because the sequence finished on its own (having come to rest on Sage and
 * faded to silence) or because the student clicked "Skip to lesson". Safe to
 * call again after a previous run finished; each call starts a fresh run.
 * @returns {Promise<void>}
 */
export function playArrival() {
  return new Promise(function (resolve) {
    pendingResolvers.push(resolve);
    beginArrival();
  });
}

// Back-compat name: the arrival used to be called the "cold open". Same
// behavior as playArrival(), kept so any existing caller of the old name
// still works; new code should prefer playArrival().
export function playColdOpen() {
  playArrival();
}

// Immediately ends the arrival wherever it is and moves forward. This is the
// handler behind the always-visible "Skip to lesson" control.
export function skipArrival() {
  finishArrival();
}

// --- view wiring -----------------------------------------------------------

export function openWorldView() {
  const world = el('world-view');
  const home = el('home-view');
  if (!world) return;
  if (home) home.hidden = true;
  world.hidden = false;
  window.scrollTo(0, 0);
  playArrival();
}

export function closeWorldView() {
  // Always stop playback on the way out: a <video>/<audio> left playing
  // behind a hidden section keeps its sound going over whatever the student
  // opened next.
  finishArrival();
  const world = el('world-view');
  const home = el('home-view');
  if (world) world.hidden = true;
  if (home) home.hidden = false;
  window.scrollTo(0, 0);
}

// Called by the shell when it takes over the screen (the lesson opening), so
// the world lets go of the audio and the DOM without also un-hiding the home
// view. This is the seam an external caller uses after onArrivalComplete /
// playArrival() fires: end the arrival, hand the screen to the lesson, then
// call suspendWorldView() so nothing here keeps running behind it.
export function suspendWorldView() {
  finishArrival();
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
  if (skip) {
    // Reused from the old cold-open markup; relabeled here (not in
    // index.html) since it is now the always-present arrival control, not a
    // one-time "skip the intro" link.
    skip.textContent = 'Skip to lesson';
    skip.addEventListener('click', skipArrival);
  }
  if (replay) replay.addEventListener('click', function () { playArrival(); });
  if (video) {
    video.addEventListener('ended', onClipBoundary);
    // A clip that fails to load must not stall the arrival — move along to
    // the next beat.
    video.addEventListener('error', onClipBoundary);
  }
}

if (typeof window !== 'undefined') {
  window.GuitarApp = window.GuitarApp || {};
  window.GuitarApp.WorldView = {
    mountWorldView,
    openWorldView,
    closeWorldView,
    suspendWorldView,
    playArrival,
    playColdOpen,
    skipArrival,
    onArrivalComplete,
    WORLD_ID,
  };
}

export default {
  mountWorldView,
  openWorldView,
  closeWorldView,
  suspendWorldView,
  playArrival,
  playColdOpen,
  skipArrival,
  onArrivalComplete,
  WORLD_ID,
};
