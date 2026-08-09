// catalog.js — discovers lessons + teachers from the content/ folder over fetch.
// Pure content discovery: no core-code change needed to add a style pack (F8).

const LESSON_MANIFEST = 'content/lessons/';
const PACKS = [
  { id: 'blues', name: 'Blues Pack', path: 'content/packs/blues/' },
  { id: 'country', name: 'Country Pack', path: 'content/packs/country/' }
];
const TEACHER_MANIFEST = 'content/teachers/';

export async function loadJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('fetch failed ' + url + ' ' + res.status);
  return res.json();
}

// Returns [{ id, title, level, lesson_type, path }] for all 20 core lessons.
export async function loadCoreLessons() {
  const files = [];
  for (let i = 1; i <= 20; i++) files.push('guitar-lesson-' + String(i).padStart(2, '0') + '-*.json');
  // Actually enumerate by globbing via known naming: try each lesson file.
  const out = [];
  const listing = await fetchDir(LESSON_MANIFEST);
  for (const f of listing) {
    if (!f.endsWith('.json')) continue;
    try {
      const data = await loadJson(LESSON_MANIFEST + f);
      out.push({ id: data.lesson.id, title: data.lesson.title, level: data.lesson.level, lesson_type: data.lesson.lesson_type, path: LESSON_MANIFEST + f, raw: data });
    } catch (e) { console.warn('lesson load', f, e); }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

export async function loadPacks() {
  const out = [];
  for (const pack of PACKS) {
    const listing = await fetchDir(pack.path);
    const lessons = [];
    let teacher = null;
    for (const f of listing) {
      if (f === 'T4.json' || f.startsWith('T') && f.endsWith('.json')) { teacher = await loadJson(pack.path + f); continue; }
      if (!f.endsWith('.json')) continue;
      try { const data = await loadJson(pack.path + f); lessons.push({ id: data.lesson.id, title: data.lesson.title, path: pack.path + f, raw: data }); }
      catch (e) { console.warn('pack lesson', f, e); }
    }
    out.push({ id: pack.id, name: pack.name, lessons, teacher });
  }
  return out;
}

export async function loadTeachers() {
  const listing = await fetchDir(TEACHER_MANIFEST);
  const out = [];
  for (const f of listing) {
    if (!f.endsWith('.json')) continue;
    try { out.push(await loadJson(TEACHER_MANIFEST + f)); } catch (e) { console.warn('teacher', f, e); }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

// Minimal static dir listing via a generated manifest.json per folder (no server indexing needed).
export async function fetchDir(path) {
  try {
    const manifest = await loadJson(path + 'manifest.json');
    if (Array.isArray(manifest.files)) return manifest.files;
  } catch (e) { /* no manifest */ }
  // Fallback: try the known file list (works for our fixed content set).
  return FALLBACK_LIST[path] || [];
}

// Fixed fallback listing so the app works from file:// without server directory indexing.
const FALLBACK_LIST = {
  'content/lessons/': Array.from({ length: 20 }, (_, i) => 'guitar-lesson-' + String(i + 1).padStart(2, '0') + '-*.json').map((p, i) => {
    const names = ['welcome-anatomy-tuning','first-chord-em','second-chord-first-song','strumming-in-time','chord-changes-em-easyc','new-chord-g','new-chord-d','new-chord-a','new-chord-am','new-chord-am-big-four','up-strums','strumming-patterns','dynamics-alternating-bass','capo-basics','faster-chord-changes','new-chord-e','minor-progressions-dm','fingerpicking-travis','read-chord-chart-tab','consolidation-performance'];
    return 'guitar-lesson-' + String(i + 1).padStart(2, '0') + '-' + names[i] + '.json';
  }),
  'content/packs/blues/': ['guitar-lesson-b1-blues-e7.json','guitar-lesson-b2-blues-a7.json','guitar-lesson-b3-blues-12bar.json','T4.json'],
  'content/packs/country/': ['guitar-lesson-c1-country-g.json','guitar-lesson-c2-country-c.json','guitar-lesson-c3-country-ivv.json'],
  'content/teachers/': ['T1.json','T2.json','T3.json']
};
