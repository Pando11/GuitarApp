// actionHandler.js — issue #7 follow-on: executes the `actions` array
// coachSurface.js's getCoachMessage()/chatEngine.js's replyWithCoach() now
// return, against whatever real UI/engine handles are on hand.
//
// This file NEVER decides what should happen — it only carries out an
// action that already arrived, using only the fields that action already
// carries (see coachSurface.js's buildActions() header for the "never
// invents a field" contract those actions are built under). A caller wires
// this in by handing applyCoachActions() a `ctx` object naming the real
// engines/DOM anchors it has available; any action whose required ctx piece
// is missing is skipped, never guessed at or silently upgraded to a
// different action.
//
// Same fail-safe posture as coachSurface.js/chatEngine.js: a malformed
// action, a missing ctx hook, or a thrown error from an engine call is
// caught and recorded in the returned report's `skipped` list — it must
// never propagate up and break the coach reply the actions rode in on.
//
// Browser-optional at import time: nothing here touches `document`/`window`
// until applyCoachActions() actually runs, and the DOM-touching helpers
// below all no-op under Node (this file's tests run there).

function hasDocument() {
  return typeof document !== 'undefined' && typeof document.createElement === 'function';
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

const DIAGRAM_CLASS = 'coach-action-diagram';
const METRONOME_CLASS = 'coach-action-metronome';

/**
 * renderDiagramAfter(anchorEl, id, action, chordSvgFn) -> Element|null
 *
 * Renders a `show_diagram` action's chord shape via the caller-supplied
 * chordSvgFn (renderer.js's chordSVG(), same function every other diagram in
 * the app already uses — never a second implementation) into a <figure>
 * inserted right after anchorEl, replacing any earlier one sharing `id` —
 * same "remove stale, mount fresh" pattern as coachSurface.js's
 * mountSpeakControlAfter().
 */
export function renderDiagramAfter(anchorEl, id, action, chordSvgFn) {
  if (!hasDocument() || !anchorEl || !anchorEl.parentNode) return null;
  if (typeof chordSvgFn !== 'function') return null;
  if (!action || typeof action.chord !== 'string' || !action.chord) return null;

  const old = document.getElementById(id);
  if (old && old.parentNode) old.parentNode.removeChild(old);

  let svg = '';
  try {
    svg = chordSvgFn({ name: action.chord, frets: action.frets, fingers: action.fingers });
  } catch (e) {
    return null;
  }
  if (typeof svg !== 'string' || !svg) return null;

  const figure = document.createElement('figure');
  figure.id = id;
  figure.className = DIAGRAM_CLASS;
  // svg is generated locally by chordSvgFn from numeric fret/finger data
  // (see renderer.js) — never user-supplied markup.
  figure.innerHTML = svg;
  anchorEl.insertAdjacentElement('afterend', figure);
  return figure;
}

/**
 * renderMetronomeStatusAfter(anchorEl, id, bpm, running) -> Element|null
 *
 * A small status line so a `set_metronome` action is visibly confirmed, not
 * just audible. Reuses the element sharing `id` across calls (rather than
 * remove+recreate) so a running metronome's status line doesn't flicker on
 * every re-render.
 */
export function renderMetronomeStatusAfter(anchorEl, id, bpm, running) {
  if (!hasDocument() || !anchorEl || !anchorEl.parentNode) return null;
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement('p');
    node.id = id;
    node.className = METRONOME_CLASS;
    anchorEl.insertAdjacentElement('afterend', node);
  }
  node.textContent = running
    ? `Metronome: ${bpm} BPM (running)`
    : `Metronome set to ${bpm} BPM`;
  return node;
}

/**
 * applyCoachActions(actions, ctx) -> { applied: Action[], skipped: {action, reason}[] }
 *
 * Executes each action in `actions` (the array coachSurface.js's
 * getCoachMessage()/chatEngine.js's replyWithCoach() return) against the
 * real engines/DOM the caller names on `ctx`. Never throws — a per-action
 * failure is caught and recorded in `skipped`, so one bad/unsupported action
 * never stops the rest from running.
 *
 * @param {Array<object>} actions
 * @param {object} [ctx]
 * @param {object} [ctx.metronome] A live 07-app/core/metronome.js instance
 *   (createMetronome()'s return) — required for `set_metronome`.
 * @param {Element} [ctx.anchorEl] DOM element the diagram/metronome status
 *   are inserted after — required for `show_diagram` and for the visible
 *   metronome status line (the metronome itself still starts/adjusts
 *   without ctx.anchorEl; only the on-screen confirmation needs it).
 * @param {string} [ctx.diagramId] Element id for the mounted diagram.
 * @param {string} [ctx.metronomeStatusId] Element id for the mounted
 *   metronome status line.
 * @param {Function} [ctx.chordSvgFn] renderer.js's chordSVG (or a test
 *   double) — required for `show_diagram`.
 * @param {Function} [ctx.openTuner] Called with no args for `open_tuner`.
 * @param {Function} [ctx.startDrill] Called with the action for
 *   `start_drill`.
 * @param {object} [ctx.adviceLedger] A 07-app/core/adviceLedger.js
 *   AdviceLedger instance — required for `log_advice`.
 * @param {Function} [ctx.onAdviceLogged] Optional callback after a
 *   successful log_advice write-through.
 */
export function applyCoachActions(actions, ctx = {}) {
  const applied = [];
  const skipped = [];
  const list = Array.isArray(actions) ? actions : [];
  const c = isPlainObject(ctx) ? ctx : {};

  for (const action of list) {
    if (!action || typeof action !== 'object' || typeof action.type !== 'string') {
      skipped.push({ action, reason: 'malformed action' });
      continue;
    }
    try {
      switch (action.type) {
        case 'set_metronome': {
          if (!c.metronome || typeof c.metronome.setBpm !== 'function') {
            skipped.push({ action, reason: 'no metronome instance on ctx' });
            break;
          }
          const bpm = c.metronome.setBpm(action.bpm);
          if (typeof c.metronome.isRunning === 'function' && !c.metronome.isRunning()
              && typeof c.metronome.start === 'function') {
            c.metronome.start();
          }
          if (c.anchorEl && c.metronomeStatusId) {
            const running = typeof c.metronome.isRunning === 'function' ? c.metronome.isRunning() : true;
            renderMetronomeStatusAfter(c.anchorEl, c.metronomeStatusId, bpm, running);
          }
          applied.push(action);
          break;
        }

        case 'show_diagram': {
          if (!c.anchorEl || !c.diagramId) {
            skipped.push({ action, reason: 'no diagram anchor on ctx' });
            break;
          }
          const node = renderDiagramAfter(c.anchorEl, c.diagramId, action, c.chordSvgFn);
          if (node) applied.push(action);
          else skipped.push({ action, reason: 'diagram render unavailable/failed' });
          break;
        }

        case 'open_tuner': {
          if (typeof c.openTuner !== 'function') {
            skipped.push({ action, reason: 'no openTuner on ctx' });
            break;
          }
          c.openTuner();
          applied.push(action);
          break;
        }

        case 'start_drill': {
          if (typeof c.startDrill !== 'function') {
            skipped.push({ action, reason: 'no startDrill on ctx' });
            break;
          }
          c.startDrill(action);
          applied.push(action);
          break;
        }

        case 'log_advice': {
          if (!c.adviceLedger || typeof c.adviceLedger.logAdvice !== 'function') {
            skipped.push({ action, reason: 'no adviceLedger on ctx' });
            break;
          }
          c.adviceLedger.logAdvice({ chord: action.chord, kind: action.kind });
          if (typeof c.onAdviceLogged === 'function') {
            try { c.onAdviceLogged(action); } catch (e) { /* non-fatal */ }
          }
          applied.push(action);
          break;
        }

        default:
          skipped.push({ action, reason: 'unknown action type' });
      }
    } catch (e) {
      skipped.push({ action, reason: 'threw: ' + (e && e.message) });
    }
  }

  return { applied, skipped };
}

export default { applyCoachActions, renderDiagramAfter, renderMetronomeStatusAfter };
