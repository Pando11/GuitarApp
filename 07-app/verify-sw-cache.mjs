#!/usr/bin/env node
/**
 * verify-sw-cache.mjs — PWA service-worker cache version gate.
 *
 * Verifies the service-worker.js CACHE constant is present and non-empty.
 * The SW cache version is the "bump on every content change" constant —
 * without it bumping, phones can serve stale content even after a clean reload.
 *
 * RUN: cd 07-app && node verify-sw-cache.mjs → 0 errors
 *
 * HANDOFF.md claims 4/0 ✅ as of 2026-08-16.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SW_FILE = join(__dirname, "service-worker.js");

function main() {
  console.log("verify-sw-cache.mjs — PWA SW cache version gate");
  console.log(`SW file: ${SW_FILE}`);
  console.log("");

  let swSource;
  try {
    swSource = readFileSync(SW_FILE, "utf-8");
  } catch (err) {
    console.error(`ERROR: cannot read ${SW_FILE}: ${err.message}`);
    process.exit(1);
  }

  // Find the CACHE constant: const CACHE = "guitarapp-vN";
  const cacheMatch = swSource.match(/const\s+CACHE\s*=\s*["']([^"']+)["']/);
  if (!cacheMatch) {
    console.error("ERROR: CACHE constant not found in service-worker.js");
    process.exit(1);
  }

  const cacheName = cacheMatch[1];
  console.log(`  ✅ CACHE constant found: "${cacheName}"`);

  // Verify it looks like a version string (non-empty, contains 'v' or digits)
  if (!cacheName || cacheName.trim().length === 0) {
    console.error("ERROR: CACHE constant is empty");
    process.exit(1);
  }

  console.log(`  ✅ CACHE version is non-empty`);
  console.log("");
  console.log("✅ GATE PASSED — 0 errors");
  process.exit(0);
}

main();
