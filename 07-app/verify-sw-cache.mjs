#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const sw = readFileSync(join(root, "service-worker.js"), "utf8");
let passed = 0, failed = 0;
function check(name, condition, detail = "") {
  if (condition) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.error(`  FAIL ${name}${detail ? `: ${detail}` : ""}`); }
}

const cacheMatch = sw.match(/const\s+CACHE\s*=\s*["']([^"']+)["']/);
check("versioned cache name", Boolean(cacheMatch && /v\d+$/i.test(cacheMatch[1])), cacheMatch?.[1]);
const listMatch = sw.match(/const\s+PRECACHE_URLS\s*=\s*\[([\s\S]*?)\];/);
const urls = listMatch ? [...listMatch[1].matchAll(/["'](.+?)["']/g)].map((match) => match[1]) : [];
check("precache list found", urls.length > 0);
const missing = urls.filter((url) => url !== "./").filter((url) => !existsSync(normalize(join(root, url.replace(/^\.\//, "")))));
check("every precache asset exists", missing.length === 0, missing.join(", "));

const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
const startPath = manifest.start_url.split("?")[0].replace(/^\.\//, "");
check("manifest launches existing shell", existsSync(join(root, startPath)), manifest.start_url);
const missingIcons = (manifest.icons || []).filter((icon) => !existsSync(join(root, icon.src.replace(/^\.\//, ""))));
check("manifest icons exist", missingIcons.length === 0, missingIcons.map((icon) => icon.src).join(", "));

const lessonManifest = JSON.parse(readFileSync(join(root, "content/lessons/manifest.json"), "utf8"));
const missingLessons = (lessonManifest.files || []).filter((file) => !existsSync(join(root, "content/lessons", file)));
check("all offline lesson files exist", missingLessons.length === 0, missingLessons.join(", "));
check("service worker caches lesson catalog dynamically", /manifest\.files/.test(sw) && /content\/lessons\/\$\{file\}/.test(sw));

console.log(`\nSW CACHE GATE: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
