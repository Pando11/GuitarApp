// modelClient.js — thin wrapper around @anthropic-ai/sdk. The Sage persona
// text below is copied from 07-app/content/teachers/T1.json (teaching_style,
// persona.tone, persona_lines) — read at module load, not re-fetched per
// request, and never interpolated with student data, so the system block
// stays byte-identical across requests (required for prompt-cache hits).

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  ANTHROPIC_API_KEY,
  ANTHROPIC_WORKSPACE_ID,
  MODEL_ID,
  MODEL_MAX_TOKENS,
  MODEL_THINKING,
  MODEL_OUTPUT_CONFIG,
  MODEL_TIMEOUT_MS,
} from './config.js';

export class TimeoutError extends Error {
  constructor(message = 'model call timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Loaded once at module init. If the persona file can't be read (e.g. a
// deployment that doesn't ship 07-app content alongside the server), fall
// back to a generic-but-fixed persona rather than crashing the service —
// the system prompt must still be a stable, non-null string.
function loadPersona() {
  const candidatePath = path.join(__dirname, '..', '..', '07-app', 'content', 'teachers', 'T1.json');
  try {
    const raw = readFileSync(candidatePath, 'utf8');
    const json = JSON.parse(raw);
    return {
      name: json.name || 'Sage',
      teachingStyle: json.teaching_style || '',
      tone: (json.persona && json.persona.tone) || '',
      catchphrase: (json.persona && json.persona.catchphrase) || '',
      lines: json.persona_lines || {},
    };
  } catch {
    return {
      name: 'Sage',
      teachingStyle: 'A calm, warm, encouraging guitar teacher who builds confidence from real practice facts.',
      tone: 'calm, warm, encouraging',
      catchphrase: '',
      lines: {},
    };
  }
}

const PERSONA = loadPersona();

/**
 * Build the ONE stable system prompt block. Must be byte-identical across
 * requests — never interpolate student data here. Cached at module load so
 * every call returns the exact same string.
 *
 * Includes T1.json's persona.catchphrase and persona_lines (intro/chord/
 * exercise/wrap) as real, owner-approved voice reference examples — these
 * were loaded into PERSONA from the start but never actually used here.
 * Makes Sage's voice more consistent and grows the system block enough to
 * clear Opus's cacheable-prefix floor — but NOT Haiku's, which is higher
 * (confirmed via `npm run test:live` against the real API, 2026-09-07:
 * cache_creation_input_tokens is 0 on every call on `claude-haiku-4-5-
 * 20251001`, total request ~497 input tokens). See STATUS.md's Wave 6 W6.1
 * notes: the no-cache-hit outcome on Haiku is an accepted tradeoff, not an
 * open bug — Haiku's per-token cost is low enough that padding the prompt
 * further just to hit its floor was judged not worth it.
 */
export function buildSystemPrompt() {
  const lines = PERSONA.lines || {};
  return [
    `You are ${PERSONA.name}, a guitar teacher. ${PERSONA.teachingStyle}`,
    `Voice: ${PERSONA.tone}.`,
    PERSONA.catchphrase ? `Catchphrase: "${PERSONA.catchphrase}"` : '',
    '',
    'Reference lines showing your voice in different moments (do not repeat these verbatim — they show tone and pacing, not the words to use):',
    lines.intro ? `- Starting a session: "${lines.intro}"` : '',
    lines.chord ? `- Introducing a chord shape: "${lines.chord}"` : '',
    lines.exercise ? `- During a drill: "${lines.exercise}"` : '',
    lines.wrap ? `- Wrapping up: "${lines.wrap}"` : '',
    '',
    'You will be given a compact summary of one student\'s stored practice facts: their profile, the current lesson, their per-chord mastery, and possibly a drill they just completed. Write a short coaching message reacting to those facts.',
    '',
    'Sometimes the student has also typed a question, which appears at the end of the user message under "Student asked". When it is there, answering it is the whole job: reply to what they actually asked, in your own voice, and only bring in the practice facts above where they genuinely bear on the answer. When there is no such question, write unprompted encouragement about the facts, as described above.',
    '',
    'RULES (do not break these):',
    '- Cite only chords and numbers given to you in the user message. Never invent a chord name, confidence number, score, or rate that was not provided. A chord the student named in their own question counts as given to you.',
    '- Write 2-3 sentences, second person, warm register. A question that genuinely needs more may take up to five, but never more.',
    '- If the question is not about guitar, or you do not have the facts to answer it, say so plainly in one sentence and point them back at the lesson. Never guess.',
    '- Respond with prose only — no JSON, no markdown, no lists, no headers.',
    '- Never suggest camera use, hand tracking, or any visual analysis of the student.',
    '- Never mention or reference specific copyrighted songs.',
    '- The facts you are given are the complete picture — do not imply you know more about the student than what is stated.',
  ].filter((line) => line !== '').join('\n');
}

// Drill scores arrive as raw floats (0.7166666666666667). Handing the model
// all seventeen digits invites it to shorten them in its reply, which the
// guardrail then has to recognize as the same number; showing two decimal
// places up front means there is nothing left to round. Integers are left
// exactly as they are.
function readable(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return String(n);
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

const MASTERY_LABEL_TEXT = {
  mastered: 'mastered',
  needs_work: 'needs work',
  not_started: 'not started',
};

/**
 * Build the volatile per-request user message from a sanitized envelope.
 * Compact labeled plain text, not raw JSON. Sections for justHappened /
 * recentHistory are OMITTED entirely when absent/empty — never sent as
 * literal "null" text.
 */
// Renders a lesson chord's verified shape as a line the model can read back.
// Strings are named rather than numbered because that is how a teacher says
// it out loud, and because "string 5" invites the model to guess which end
// the count starts from. Returns '' when the lesson names a chord without
// diagramming it, so the name still reaches the prompt on its own.
const STRING_NAMES = ['low E', 'A', 'D', 'G', 'B', 'high e'];

function describeShape(shape) {
  const frets = Array.isArray(shape.frets) ? shape.frets : null;
  if (!frets) return '';
  const fingers = Array.isArray(shape.fingers) ? shape.fingers : [];
  const parts = [];
  for (let i = 0; i < frets.length; i += 1) {
    const name = STRING_NAMES[i] || `string ${i + 1}`;
    const fret = frets[i];
    if (fret === null) { parts.push(`${name} muted`); continue; }
    if (fret === 0) { parts.push(`${name} open`); continue; }
    const finger = fingers[i];
    const withFinger = (typeof finger === 'number' && finger > 0) ? ` with finger ${finger}` : '';
    parts.push(`${name} fret ${fret}${withFinger}`);
  }
  return `: ${parts.join(', ')}`;
}

export function buildUserMessage(envelope) {
  const lines = [];
  const profile = envelope.learnerProfile || {};

  // Each profile field is optional (see schema.js — onboarding is skippable,
  // so a real student can arrive with none of them). Build the line from what
  // is actually known and say plainly when nothing is: writing "undefined"
  // into the prompt would have the model treat a missing fact as a stated one.
  const profileBits = [];
  if (profile.ageBand) profileBits.push(profile.ageBand);
  if (profile.experience) profileBits.push(profile.experience);
  if (profile.goal) profileBits.push(`goal: ${profile.goal}`);
  if (typeof profile.minutesPerDay === 'number') profileBits.push(`${profile.minutesPerDay} min/day`);
  lines.push(profileBits.length
    ? `Student: ${profileBits.join(', ')}.`
    : 'Student: nothing on file yet — they have not filled in a profile.');

  // lessonId is optional: the practice screen has no lesson to name. Say
  // where they are instead of printing "null" at the model.
  lines.push(envelope.lessonId
    ? `Lesson: ${envelope.lessonId}${envelope.stepId ? `, step ${envelope.stepId}` : ''}.`
    : 'Context: free practice, not inside a lesson.');

  // The chords this lesson teaches, with their verified fingerings. Stated
  // separately from mastery because it is a fact about the page, not about
  // the student: a beginner may have no recorded number for a chord the
  // lesson is entirely about. Two things depend on it — the model may name
  // these chords without guardrail.js rejecting the answer, and it does not
  // have to invent a fingering. Asked how to make Em sound clean with only
  // the name to work from, it said "third fret of the D string" on
  // 2026-09-08; the lesson says second. Sending the real numbers is the fix.
  const lessonChords = Array.isArray(envelope.lessonChords) ? envelope.lessonChords : [];
  if (lessonChords.length) {
    lines.push('Chords this lesson teaches (safe to name, and these fingerings are the verified ones — use them, never guess a fret):');
    for (const shape of lessonChords) {
      if (!shape || typeof shape.chord !== 'string') continue;
      lines.push(`  ${shape.chord}${describeShape(shape)}`);
    }
  }

  const mastery = Array.isArray(envelope.mastery) ? envelope.mastery : [];
  if (mastery.length) {
    const parts = mastery.map((m) => `${m.chord}=${m.confidence} (${MASTERY_LABEL_TEXT[m.label] || m.label})`);
    lines.push(`Chord mastery: ${parts.join(', ')}.`);
  }

  if (envelope.justHappened) {
    const jh = envelope.justHappened;
    lines.push(`Just did drill ${jh.drillId}: ${jh.passed ? 'passed' : 'not passed'}, score ${readable(jh.score)}, rate ${readable(jh.ratePerMin)}/min.`);
  }

  const recentHistory = Array.isArray(envelope.recentHistory) ? envelope.recentHistory : [];
  if (recentHistory.length) {
    const parts = recentHistory
      .slice(-3)
      .map((h) => `${h.lessonId} (${h.confidenceDelta >= 0 ? '+' : ''}${h.confidenceDelta})`);
    lines.push(`Recent lessons: ${parts.join(', ')}.`);
  }

  // Last, and clearly delimited: the student's own words. Kept at the end so
  // the stored facts always read as the established context and the question
  // as the thing being answered. Quoted rather than merged into the prose
  // above so the model can tell where the student's text starts and stops.
  if (typeof envelope.question === 'string' && envelope.question.length) {
    lines.push(`Student asked: "${envelope.question}"`);
  }

  return lines.join('\n');
}

let _defaultClient = null;
function getDefaultClient() {
  if (!_defaultClient) {
    const opts = { apiKey: ANTHROPIC_API_KEY };
    // See config.js — only set when the key is org-level, not workspace-scoped.
    if (ANTHROPIC_WORKSPACE_ID) {
      opts.defaultHeaders = { 'anthropic-workspace-id': ANTHROPIC_WORKSPACE_ID };
    }
    _defaultClient = new Anthropic(opts);
  }
  return _defaultClient;
}

/**
 * Call the coaching model. `client` is injectable for tests (never make a
 * real network call in tests unless ANTHROPIC_API_KEY is set AND the test
 * explicitly opts in). Rejects with TimeoutError if the call doesn't finish
 * within timeoutMs.
 *
 * @param {object} envelope - sanitized facts envelope
 * @param {object} [opts]
 * @param {object} [opts.client] - injected Anthropic-like client (must expose messages.create)
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<{prose: string, usage: object}>}
 */
export async function callCoach(envelope, { client = getDefaultClient(), timeoutMs = MODEL_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError());
    }, timeoutMs);
  });

  const request = {
    model: MODEL_ID,
    max_tokens: MODEL_MAX_TOKENS,
    system: [
      {
        type: 'text',
        text: buildSystemPrompt(),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      { role: 'user', content: buildUserMessage(envelope) },
    ],
  };
  // thinking/output_config are Opus-only extended-thinking controls — not
  // every model supports them (e.g. Haiku 4.5 rejects thinking:{type:
  // 'adaptive'} with a 400 "adaptive thinking is not supported on this
  // model", hit while switching models on 2026-09-07). Only sent when the
  // configured model actually wants them (see config.js MODEL_THINKING/
  // MODEL_OUTPUT_CONFIG).
  if (MODEL_THINKING) request.thinking = MODEL_THINKING;
  if (MODEL_OUTPUT_CONFIG) request.output_config = MODEL_OUTPUT_CONFIG;

  const requestPromise = client.messages.create(request, { signal: controller.signal });

  try {
    const response = await Promise.race([requestPromise, timeoutPromise]);
    clearTimeout(timer);
    const textBlock = (response.content || []).find((b) => b.type === 'text');
    return {
      prose: textBlock ? textBlock.text : '',
      usage: response.usage || {},
    };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export default { buildSystemPrompt, buildUserMessage, callCoach, TimeoutError };
