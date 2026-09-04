import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { verifyFirstLessons } from "./verify-first-lessons.mjs";

const source = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (m) => m.slice(1))), "..");
let passed = 0;
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "guitarapp-l1-5-"));
  fs.cpSync(path.join(source, "07-app", "content", "lessons"), path.join(root, "07-app", "content", "lessons"), { recursive: true });
  fs.mkdirSync(path.join(root, "07-app", "core"), { recursive: true });
  fs.copyFileSync(path.join(source, "07-app", "app.js"), path.join(root, "07-app", "app.js"));
  fs.copyFileSync(path.join(source, "07-app", "core", "backupButtons.js"), path.join(root, "07-app", "core", "backupButtons.js"));
  return root;
}
function test(name, mutate, expected) {
  const root = fixture();
  try {
    mutate(root);
    const result = verifyFirstLessons(root);
    assert.ok(expected(result), `${name}: unexpected result\n${result.errors.join("\n")}`);
    console.log(`PASS: ${name}`); passed++;
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
const lesson = (root, n, slug) => path.join(root, "07-app", "content", "lessons", `guitar-lesson-0${n}-${slug}.json`);
const edit = (file, fn) => { const data = JSON.parse(fs.readFileSync(file)); fn(data); fs.writeFileSync(file, JSON.stringify(data)); };

test("pristine production slice is green", () => {}, (r) => r.errors.length === 0 && r.checked === 5);
test("rejects a forward prerequisite", (r) => edit(lesson(r, 2, "holding-the-pick"), (d) => d.lesson.prerequisites = ["Future skill (L05)"]), (r) => r.errors.some((e) => e.includes("forward/self")));
test("rejects inconsistent repeated chord shape", (r) => edit(lesson(r, 5, "strumming-in-time"), (d) => d.chords.Em.frets[0] = 1), (r) => r.errors.some((e) => e.includes("disagrees")));
test("rejects undeclared exercise chord", (r) => edit(lesson(r, 4, "second-chord-first-song"), (d) => d.exercises[0].params.chord = "G"), (r) => r.errors.some((e) => e.includes("without a local")));
test("rejects missing tap fallback", (r) => fs.writeFileSync(path.join(r, "07-app", "core", "backupButtons.js"), ""), (r) => r.errors.some((e) => e.includes("practice fallback")));
test("rejects missing asset reference", (r) => edit(lesson(r, 1, "welcome-anatomy-tuning"), (d) => { d.audio = "../../../audio/missing.wav"; }), (r) => r.errors.some((e) => e.includes("asset reference")));

console.log(`First-lessons adversarial tests: ${passed}/6 passed`);
