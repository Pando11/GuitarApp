// templateFallback.js — a minimal, standalone fallback prose generator.
//
// This is INTENTIONALLY a separate implementation from
// 07-app/core/chatEngine.js's PERSONA templates, not a shared import — the
// server is deployed independently from the static app bundle, and pulling
// in 07-app/core code here would either duplicate it via a build step (this
// project has none) or reach across the client/server boundary in a way
// that risks the API key ending up in a bundle meant for the browser. The
// tone/register below is modeled on chatEngine.js's Sage (T1) persona
// (warm, calm, second person, cites only real stored numbers) but the code
// itself is not shared.
//
// Same Rule 5 discipline applies here as to the model path: only cite
// numbers/labels actually present in the envelope, never invent one.

function pickWeakest(mastery) {
  const withConfidence = (mastery || []).filter((m) => m && typeof m.confidence === 'number');
  if (!withConfidence.length) return null;
  return withConfidence.slice().sort((a, b) => a.confidence - b.confidence)[0];
}

function pickStrongest(mastery) {
  const withConfidence = (mastery || []).filter((m) => m && typeof m.confidence === 'number');
  if (!withConfidence.length) return null;
  return withConfidence.slice().sort((a, b) => b.confidence - a.confidence)[0];
}

/**
 * Build 2-3 sentences of warm, second-person coaching prose using only
 * facts present in the (already-validated) envelope. Pure and deterministic
 * given the same envelope — no randomness, no network.
 */
export function getFallbackProse(envelope) {
  const mastery = envelope && Array.isArray(envelope.mastery) ? envelope.mastery : [];
  const justHappened = envelope && envelope.justHappened;

  // A student who typed a question is owed an answer, and this path has no
  // way to produce one — every branch below is generic encouragement built
  // from stored numbers. Saying so is the only honest option: inventing an
  // answer would break Rule 5, and handing back unrelated encouragement
  // reads as if the question was ignored.
  if (envelope && typeof envelope.question === 'string' && envelope.question.length) {
    return "I couldn't reach my answer for that one just now — ask me again in a moment. In the meantime, keep working the step you're on and take it slowly.";
  }

  if (justHappened && typeof justHappened.drillId === 'string') {
    if (justHappened.passed) {
      return `Nice work on ${justHappened.drillId} — that's a clean pass. Keep that same relaxed hand on the next run.`;
    }
    return `That rep on ${justHappened.drillId} wasn't clean yet, and that's fine — slow it down and let the shape settle before you try again.`;
  }

  const weakest = pickWeakest(mastery);
  const strongest = pickStrongest(mastery);

  if (weakest && weakest.label !== 'mastered') {
    return `Your ${weakest.chord} is still the one to work on. Keep the tempo relaxed and give it a few more clean reps — no rush.`;
  }

  if (strongest) {
    return `Your ${strongest.chord} is sounding solid. Keep that same steady hand as you move into the next part of the lesson.`;
  }

  return "Let's keep going — take the next step at your own pace, and we'll check in on how it feels.";
}

export default { getFallbackProse };
