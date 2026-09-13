// studentNotes.js — stores things the student says in their own words
// ("my fingers hurt", "I only have ten minutes today"), dated and optionally
// tagged by chord. These are NEVER converted to numbers or diagnoses: the
// quoted text is stored and returned as-is, verbatim.
//
// Same storage pattern as practiceStore.js: a pure in-memory class with
// toJSON()/fromJSON(). ZERO network, ZERO direct localStorage access here —
// a caller (e.g. app.js) owns persistence.

import { canonChord } from './chord-canon.js';

export class StudentNotesStore {
  constructor(initial) {
    const i = initial || {};
    this.notes = (i.notes || []).map(n => ({ ...n }));
  }

  addNote({ text, chord, timestamp } = {}) {
    if (!text || typeof text !== 'string' || !text.trim()) throw new Error('bad note text: ' + text);
    const note = {
      text: text.trim(), // stored verbatim, never parsed/numbered
      chord: chord ? canonChord(chord) : null,
      timestamp: timestamp || Date.now(),
    };
    this.notes.push(note);
    return { ...note };
  }

  // Most recent notes first.
  getRecentNotes(limit = 10) {
    return this.notes.slice(-limit).reverse().map(n => ({ ...n }));
  }

  getNotesForChord(chord) {
    const key = canonChord(chord);
    return this.notes.filter(n => n.chord === key).map(n => ({ ...n }));
  }

  toJSON() { return { notes: this.notes.map(n => ({ ...n })) }; }
  static fromJSON(o) { return new StudentNotesStore(o); }
}
