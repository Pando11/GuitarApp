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
      lines: json.persona_lines || {},
    };
  } catch {
    return {
      name: 'Sage',
      teachingStyle: 'A calm, warm, encouraging guitar teacher who builds confidence from real practice facts.',
      tone: 'calm, warm, encouraging',
      lines: {},
    };
  }
}

const PERSONA = loadPersona();

/**
 * Build the ONE stable system prompt block. Must be byte-identical across
 * requests — never interpolate student data here. Cached at module load so
 * every call returns the exact same string.
 */
export function buildSystemPrompt() {
  return [
    `You are ${PERSONA.name}, a guitar teacher. ${PERSONA.teachingStyle}`,
    `Voice: ${PERSONA.tone}.`,
    '',
    'You will be given a compact summary of one student\'s stored practice facts: their profile, the current lesson, their per-chord mastery, and possibly a drill they just completed. Write a short coaching message reacting to those facts.',
    '',
    'RULES (do not break these):',
    '- Cite only chords and numbers given to you in the user message. Never invent a chord name, confidence number, score, or rate that was not provided.',
    '- Write 2-3 sentences, second person, warm register.',
    '- Respond with prose only — no JSON, no markdown, no lists, no headers.',
  ].join('\n');
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
export function buildUserMessage(envelope) {
  const lines = [];
  const profile = envelope.learnerProfile || {};

  lines.push(`Student: ${profile.ageBand}, ${profile.experience}, goal: ${profile.goal}, ${profile.minutesPerDay} min/day.`);
  lines.push(`Lesson: ${envelope.lessonId}${envelope.stepId ? `, step ${envelope.stepId}` : ''}.`);

  const mastery = Array.isArray(envelope.mastery) ? envelope.mastery : [];
  if (mastery.length) {
    const parts = mastery.map((m) => `${m.chord}=${m.confidence} (${MASTERY_LABEL_TEXT[m.label] || m.label})`);
    lines.push(`Chord mastery: ${parts.join(', ')}.`);
  }

  if (envelope.justHappened) {
    const jh = envelope.justHappened;
    lines.push(`Just did drill ${jh.drillId}: ${jh.passed ? 'passed' : 'not passed'}, score ${jh.score}, rate ${jh.ratePerMin}/min.`);
  }

  const recentHistory = Array.isArray(envelope.recentHistory) ? envelope.recentHistory : [];
  if (recentHistory.length) {
    const parts = recentHistory
      .slice(-3)
      .map((h) => `${h.lessonId} (${h.confidenceDelta >= 0 ? '+' : ''}${h.confidenceDelta})`);
    lines.push(`Recent lessons: ${parts.join(', ')}.`);
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

  const requestPromise = client.messages.create(
    {
      model: MODEL_ID,
      max_tokens: MODEL_MAX_TOKENS,
      thinking: MODEL_THINKING,
      output_config: MODEL_OUTPUT_CONFIG,
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
    },
    { signal: controller.signal },
  );

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
