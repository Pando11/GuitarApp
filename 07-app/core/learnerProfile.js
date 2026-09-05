// learnerProfile.js — T0.4 Onboarding: capture the learner profile.
//
// Four skippable questions, stored locally so Tier 1+ features can eventually
// read them. This module ONLY collects the data — nothing here may branch
// lesson content on it (that is Tier 1 scope, see docs/plans/TIER-0-ship-it.md).
//
// COPPA NOTE: ageBand 'under-13' is a compliance flag. Tier 2 MUST implement
// parental consent before any payment or account creation for these learners.
// Nothing in this module (or Tier 0) builds that consent flow — it only
// records the band so later tiers can gate on it.
//
// Pure module: no DOM imports, so this can run under plain Node for tests.
// Persists to localStorage under key 'guitarapp.learnerProfile.v1'.

export const STORAGE_KEY = 'guitarapp.learnerProfile.v1';

export const PROFILE_SCHEMA = {
  ageBand: ['under-13', '13-17', '18-34', '35-54', '55+'],
  experience: ['never-held-one', 'tried-and-quit', 'returning-player'],
  goal: ['play-a-song', 'campfire-friends', 'understand-music', 'just-curious'],
  minutesPerDay: [5, 15, 30, 60],
};

const FIELDS = Object.keys(PROFILE_SCHEMA);

// --- storage backend ---------------------------------------------------------
// Uses globalThis.localStorage if present, otherwise an in-memory fallback
// (Node tests / any environment without a DOM).
const _mem = new Map();

function _ls() {
  try {
    return (typeof globalThis !== 'undefined' && globalThis.localStorage) ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

function _read() {
  const ls = _ls();
  const raw = ls ? ls.getItem(STORAGE_KEY) : _mem.get(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch {
    return {};
  }
}

function _write(obj) {
  const raw = JSON.stringify(obj);
  const ls = _ls();
  if (ls) ls.setItem(STORAGE_KEY, raw); else _mem.set(STORAGE_KEY, raw);
}

// --- validation ---------------------------------------------------------------
function isValidValue(field, value) {
  const allowed = PROFILE_SCHEMA[field];
  if (!allowed) return false;
  return allowed.includes(value);
}

// --- public API ---------------------------------------------------------------

// Returns the currently stored profile (a plain object, possibly partial/empty).
export function getProfile() {
  return _read();
}

// Merges `partial` into the stored profile. Only recognized fields with
// values that pass their schema's allow-list are accepted; unknown fields or
// invalid values throw so callers cannot silently corrupt the stored profile.
export function setProfile(partial) {
  if (!partial || typeof partial !== 'object') {
    throw new Error('setProfile: partial must be an object');
  }
  const current = _read();
  for (const key of Object.keys(partial)) {
    if (!FIELDS.includes(key)) {
      throw new Error(`setProfile: unknown field "${key}"`);
    }
    if (!isValidValue(key, partial[key])) {
      throw new Error(`setProfile: invalid value for "${key}": ${JSON.stringify(partial[key])}`);
    }
  }
  const next = { ...current, ...partial };
  _write(next);
  return next;
}

// True once every field in PROFILE_SCHEMA has a valid value stored.
export function isComplete() {
  const profile = _read();
  return FIELDS.every((f) => isValidValue(f, profile[f]));
}

// Test/dev helper: wipes the stored profile. Not part of the onboarding UX.
export function _resetProfile() {
  const ls = _ls();
  if (ls) ls.removeItem(STORAGE_KEY); else _mem.delete(STORAGE_KEY);
}
