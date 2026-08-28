// content-attribution.js — BUILDER (boardroom/growth-2026-08)
// Normalized from original (Unicode dashes replaced with ASCII so Node can parse).
// Offline, dependency-free scanner that builds the install/subscription ATTRIBUTION MAP
// from existing content + asset-job files. No network, no paid tool (PocketBase-ready:
// the emitted `content_id` values are the keys an install/subscription ledger would use).
//
// Run: node tools/content-attribution.js            (prints JSON to stdout)
//      node tools/content-attribution.js --write     (also writes tools/content-attribution-map.json)
//
// This makes the cinematic-content pipeline *attribution-ready* WITHOUT breaking it and
// WITHOUT introducing any paid dependency. Every new AssetJob is now hard-gated (see
// 07-app/core/asset-job.js) to carry {campaign_source, content_id, world_id}.

import { readdirSync, readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const TEACHERS_DIR = join(ROOT, '07-app/content/teachers');
const LESSONS_DIR = join(ROOT, '07-app/content/lessons');
const GODOT_DIR = join(ROOT, '07-app/godot/data');

function readJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}
function readJsonDir(dir, suffix = '.json') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(suffix))
    .map((f) => ({ file: f, data: readJson(join(dir, f)) }))
    .filter((x) => x.data);
}

// 1) asset-jobs -> attribution tags
const assetJobs = readJsonDir(TEACHERS_DIR, '.assetjob.json').map((x) => ({
  jobId: x.data.id,
  teacherId: x.data.teacherId,
  model: x.data.model,
  purpose: x.data.purpose,
  world_id: x.data.attribution?.world_id || null,
  campaign_source: x.data.attribution?.campaign_source || null,
  content_id: x.data.attribution?.content_id || null,
}));

// 2) teachers -> name
const teachers = readJsonDir(TEACHERS_DIR, '.json')
  .filter((x) => !x.file.endsWith('.assetjob.json'))
  .map((x) => ({ teacherId: x.data.id, name: x.data.name || x.file, world_id: x.data.world_id || null }));

// 3) lessons (manifest list)
const lessonManifest = readJson(join(LESSONS_DIR, 'manifest.json'));
const lessons = (lessonManifest?.files || []).map((f) => {
  const d = readJson(join(LESSONS_DIR, f));
  return { id: d?.id || f, file: f, title: d?.title || null };
});

// 4) godot world manifest (world_art / style_anchor)
const godotManifest = readJson(join(GODOT_DIR, 'lesson_manifest.json')) || [];

// 5) build world_id -> attribution keyed map
const worldMap = {};
for (const j of assetJobs) {
  const w = j.world_id || 'UNMAPPED';
  worldMap[w] = worldMap[w] || { world_id: w, asset_jobs: [], content_ids: [] };
  worldMap[w].asset_jobs.push(j.jobId);
  if (j.content_id) worldMap[w].content_ids.push(j.content_id);
}

const map = {
  generated_at: new Date().toISOString().slice(0, 10),
  note: 'content_id values are the keys an install/subscription ledger (PocketBase / local) keys on. Free + offline.',
  attribution_ready: true,
  teachers,
  asset_jobs: assetJobs,
  lessons_count: lessons.length,
  godot_world_art: godotManifest.map((g) => ({ id: g.id, world_art: g.world_art, style_anchor: g.style_anchor })),
  world_attribution_map: Object.values(worldMap),
  // flat list a downstream ledger/UTM layer would consume:
  install_attribution_keys: assetJobs
    .filter((j) => j.content_id)
    .map((j) => ({ content_id: j.content_id, campaign_source: j.campaign_source, world_id: j.world_id, teacher_id: j.teacherId })),
};

const write = process.argv.includes('--write');
if (write) {
  writeFileSync(join(ROOT, 'tools/content-attribution-map.json'), JSON.stringify(map, null, 2));
  console.error('Wrote tools/content-attribution-map.json');
}
console.log(JSON.stringify(map, null, 2));
