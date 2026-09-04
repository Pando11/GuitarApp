#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ID_RE = /^L(0[1-5])-/;
const REF_RE = /(?:^|\s|\()L(\d{2})(?:\)|\b)/g;

function readJson(file, errors) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { errors.push(`${path.basename(file)}: invalid JSON (${error.message})`); return null; }
}

function referencedFiles(value, out = []) {
  if (typeof value === "string" && /\.(?:wav|mp3|ogg|m4a|aac|png|jpe?g|webp|svg)$/i.test(value)) out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => referencedFiles(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => referencedFiles(item, out));
  return out;
}

export function verifyFirstLessons(root = DEFAULT_ROOT) {
  const errors = [], warnings = [];
  const lessonsDir = path.join(root, "07-app", "content", "lessons");
  const manifestFile = path.join(lessonsDir, "manifest.json");
  const manifest = readJson(manifestFile, errors);
  const entries = manifest && (manifest.files || manifest.lessons);
  if (!Array.isArray(entries)) errors.push("manifest.json: expected a files[] or lessons[] array");
  const names = Array.isArray(entries) ? entries.map((e) => typeof e === "string" ? e : e && e.file) : [];
  const first = names.filter((name) => /^guitar-lesson-0[1-5]-.*\.json$/.test(name || ""));
  if (first.length !== 5) errors.push(`manifest.json: expected exactly five L1-L5 files, found ${first.length}`);

  const chordCanon = new Map();
  const seenIds = new Set();
  for (let index = 0; index < first.length; index++) {
    const name = first[index];
    const file = path.join(lessonsDir, name);
    if (!fs.existsSync(file)) { errors.push(`${name}: manifest target is missing`); continue; }
    const data = readJson(file, errors);
    if (!data) continue;
    const lesson = data.lesson;
    if (!lesson || typeof lesson !== "object") { errors.push(`${name}: missing lesson object`); continue; }
    const expected = index + 1;
    const match = typeof lesson.id === "string" && lesson.id.match(ID_RE);
    if (!match || Number(match[1]) !== expected) errors.push(`${name}: lesson.id must begin L${String(expected).padStart(2, "0")}-`);
    if (seenIds.has(lesson.id)) errors.push(`${name}: duplicate lesson.id ${lesson.id}`);
    seenIds.add(lesson.id);
    for (const key of ["title", "level", "lesson_type", "one_line_promise"]) if (!lesson[key]) errors.push(`${name}: lesson.${key} is required`);
    if (!Array.isArray(lesson.objectives) || !lesson.objectives.length) errors.push(`${name}: lesson.objectives must be non-empty`);
    if (!Array.isArray(lesson.prerequisites)) errors.push(`${name}: lesson.prerequisites must be an array`);
    for (const prerequisite of lesson.prerequisites || []) {
      for (const ref of prerequisite.matchAll(REF_RE)) if (Number(ref[1]) >= expected) errors.push(`${name}: forward/self prerequisite ${ref[0].trim()}`);
    }
    if (!Array.isArray(data.exercises) || !data.exercises.length) errors.push(`${name}: exercises must be non-empty`);

    const chords = data.chords && typeof data.chords === "object" ? data.chords : {};
    for (const [symbol, shape] of Object.entries(chords)) {
      if (symbol.startsWith("_")) continue;
      if (!shape || !Array.isArray(shape.frets) || shape.frets.length !== 6 || !Array.isArray(shape.fingers) || shape.fingers.length !== 6)
        errors.push(`${name}: chord ${symbol} needs six frets and six fingers`);
      else {
        const signature = JSON.stringify({ frets: shape.frets, fingers: shape.fingers });
        if (chordCanon.has(symbol) && chordCanon.get(symbol) !== signature) errors.push(`${name}: chord ${symbol} disagrees with its earlier L1-L5 shape`);
        chordCanon.set(symbol, signature);
        if (!String(shape.qa_status || "").startsWith("verified-by-theory-check-")) errors.push(`${name}: chord ${symbol} lacks theory-check verification`);
      }
    }
    const used = [];
    for (const ex of data.exercises || []) {
      if (!ex.id || !ex.name || !ex.purpose || !ex.coaching || !ex.params) errors.push(`${name}: every exercise needs id, name, purpose, coaching, and params`);
      if (ex.params?.chord) used.push(ex.params.chord);
      if (Array.isArray(ex.params?.chord_cycle)) used.push(...ex.params.chord_cycle);
    }
    for (const symbol of used) if (!Object.hasOwn(chords, symbol)) errors.push(`${name}: exercise references chord ${symbol} without a local verified shape`);
    for (const ref of referencedFiles(data)) {
      const resolved = path.resolve(path.dirname(file), ref);
      if (!resolved.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(resolved)) errors.push(`${name}: missing or unsafe asset reference ${ref}`);
    }
  }

  const appFile = path.join(root, "07-app", "app.js");
  const fallbackFile = path.join(root, "07-app", "core", "backupButtons.js");
  const app = fs.existsSync(appFile) ? fs.readFileSync(appFile, "utf8") : "";
  const fallback = fs.existsSync(fallbackFile) ? fs.readFileSync(fallbackFile, "utf8") : "";
  if (!/mountBackupButtons/.test(app) || !/Got it/.test(fallback) || !/Not yet/.test(fallback))
    errors.push("practice fallback: app must mount always-available Got it / Not yet controls");
  return { errors, warnings, checked: first.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rootArg = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT;
  const result = verifyFirstLessons(rootArg);
  result.errors.forEach((e) => console.error(`ERROR: ${e}`));
  result.warnings.forEach((w) => console.warn(`WARN: ${w}`));
  console.log(`First-lessons gate: ${result.checked}/5 lessons, ${result.errors.length} errors, ${result.warnings.length} warnings`);
  process.exitCode = result.errors.length ? 1 : 0;
}
