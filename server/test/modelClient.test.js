import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSystemPrompt, buildUserMessage, callCoach, TimeoutError } from '../src/modelClient.js';

function envelope(overrides = {}) {
  return {
    learnerProfile: { ageBand: '18-34', experience: 'never-held-one', goal: 'play songs', minutesPerDay: 15 },
    lessonId: 'L01',
    stepId: null,
    mastery: [{ chord: 'G', label: 'needs_work', confidence: 40 }],
    justHappened: null,
    recentHistory: [],
    ...overrides,
  };
}

test('buildSystemPrompt is identical across two calls (cache stability)', () => {
  const a = buildSystemPrompt();
  const b = buildSystemPrompt();
  assert.equal(a, b);
});

test('callCoach passes the exact required params to the mocked SDK', async () => {
  let capturedRequest = null;
  const fakeClient = {
    messages: {
      create: async (request) => {
        capturedRequest = request;
        return { content: [{ type: 'text', text: 'ok' }], usage: { cache_read_input_tokens: 0 } };
      },
    },
  };

  await callCoach(envelope(), { client: fakeClient });

  assert.equal(capturedRequest.model, 'claude-opus-5');
  assert.equal(capturedRequest.max_tokens, 512);
  assert.deepEqual(capturedRequest.thinking, { type: 'adaptive' });
  assert.deepEqual(capturedRequest.output_config, { effort: 'low' });
  assert.equal(capturedRequest.system[0].cache_control.type, 'ephemeral');
});

test('two sequential calls send byte-identical system content (cache-hit precondition)', async () => {
  const seenSystems = [];
  const fakeClient = {
    messages: {
      create: async (request) => {
        seenSystems.push(request.system);
        return { content: [{ type: 'text', text: 'ok' }], usage: {} };
      },
    },
  };

  await callCoach(envelope({ lessonId: 'L01' }), { client: fakeClient });
  await callCoach(envelope({ lessonId: 'L02', mastery: [{ chord: 'C', label: 'mastered', confidence: 90 }] }), { client: fakeClient });

  assert.deepEqual(seenSystems[0], seenSystems[1]);
});

test('callCoach times out and rejects with TimeoutError when the mock never resolves', async () => {
  const fakeClient = {
    messages: {
      create: () => new Promise(() => {}), // never resolves
    },
  };

  await assert.rejects(
    () => callCoach(envelope(), { client: fakeClient, timeoutMs: 20 }),
    TimeoutError,
  );
});

test('user message omits the justHappened section entirely when null', () => {
  const msg = buildUserMessage(envelope({ justHappened: null }));
  assert.ok(!msg.includes('null'));
  assert.ok(!msg.toLowerCase().includes('just did'));
});

test('user message includes the justHappened section when present', () => {
  const msg = buildUserMessage(envelope({ justHappened: { drillId: 'd1', passed: true, score: 90, ratePerMin: 10 } }));
  assert.ok(msg.includes('Just did drill d1'));
});

test('user message omits recentHistory section when empty', () => {
  const msg = buildUserMessage(envelope({ recentHistory: [] }));
  assert.ok(!msg.includes('Recent lessons'));
});
