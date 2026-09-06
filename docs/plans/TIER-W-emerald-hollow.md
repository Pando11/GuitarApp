# TIER-W — Emerald Hollow: reunite the world with the app

**Created:** 2026-09-06
**Intended executor:** a cost-efficient model (Haiku 4.5 / Sonnet 5) running as
lead agent in Claude Code, spawning subagents per
[`README.md`](README.md)'s orchestration contract.
**Read before starting:** [`README.md`](README.md) (orchestration contract),
[`STATUS.md`](STATUS.md) (current state), [`../adr/0004-the-teacher-world-1-emerald-hollow.md`](../adr/0004-the-teacher-world-1-emerald-hollow.md) (what Emerald Hollow *is*).

---

## Why this file exists

The repo is split in two and has been since **2026-08-24**. Neither half is
broken; they just never came back together.

| | Branch | Last work | Contains |
|---|---|---|---|
| **The app** | `main` (pushed to GitHub) | 2026-09-06 | 25 lessons, practice drills, tuner, adaptive/coach engine, PWA shell |
| **The world** | `h5-05content-backfill` (**local only, never pushed**) | 2026-08-30 | Emerald Hollow Godot project, Sage, video clips, voice, content backfill, tooling |

**Verified facts** (measured 2026-09-06, not assumed):

- The three local `boardroom/*` + `h5-*` branches are **stacked**:
  `boardroom/content-pipeline-recon-20260826` ⊂ `boardroom/growth-2026-08-30` ⊂
  `h5-05content-backfill`. **`h5-05content-backfill` is a superset — it is the
  only branch you need to merge.** The other two are historical.
- Merge base: `cdf47c9` (2026-08-24). `main` is **30 commits** ahead of it;
  `h5-05content-backfill` is **16 commits** ahead of it.
- 1743 files changed on the `main` side, 1188 on the `h5` side, **370 touched on
  both**, of which **exactly 38 actually conflict** (`git merge-tree` dry run).
  The full list is in Wave 2 below.
- **No Git LFS.** Largest blob is 7.02 MB. A normal `git push` is safe.
- Godot project root is `07-app/godot/`, `main_scene = res://world/World.tscn`,
  engine **4.7.x**. `World.gd::_ready()` auto-calls `enter_lesson("W1-coldopen")`,
  which plays `B00_walkin.ogv → B01_meetsage.ogv → B02_twoshot.ogv` with Sage's
  voice over B01 and B02. **Pressing F5 in Godot is the "walk in and meet the
  teacher" moment.** It already works — it just isn't on `main`.
- The world clips exist **twice** on the h5 branch:
  `07-app/assets/worlds/emerald-hollow/` (`.mp4` + `.ogv`) and
  `07-app/godot/assets/worlds/emerald-hollow/` (`.ogv` only). Godot reads the
  second. Deduplicating is a Wave 5 cleanup, not a blocker.

### The freeze problem — RESOLVED 2026-09-06

`README.md` § "What is explicitly frozen" and `CLAUDE.md` both listed **"Godot
world shell, Emerald Hollow art production"** as frozen until Tier 2 ships, and
the standard subagent prompt tells agents to report-and-stop if a task touches a
frozen item — so a correctly-behaving subagent would have refused every task in
this file. **The owner lifted that freeze on 2026-09-06 (W0.1, done).** Both
lists are amended and you can dispatch against this tier.

**The lift covers those two items only.** `band-engine.js` and Path A live duet
are still frozen despite being adjacent to world work — do not touch either
because the world is now in scope.

---

## Phase O — Owner-only (no model can do these)

Do these yourself. Nothing below Wave 1 works without O.1; nothing in Wave 6
works without O.2/O.3.

| ID | Task | How |
|----|------|-----|
| **O.1** | Install **Godot 4.7.x** (free, MIT) | https://godotengine.org/download — "Godot Engine 4.7.x standard" (not .NET). Unzip anywhere, e.g. `C:\Godot\`. No installer needed. |
| **O.2** | Point GitHub at the right branch | github.com/Pando11/GuitarApp → Settings → General → Default branch → switch **`master` → `main`**. `master` is frozen at 2026-08-12 and is the "old app" that keeps showing up. Do **not** delete `master` yet — rename it `archive/master-2026-08-12` instead. |
| **O.3** | Turn on Pages properly | Same repo → Settings → **Pages** → Source = **GitHub Actions**. The existing `.github/workflows/deploy-pages.yml` publishes `07-app/` on every push to `main`. |
| **O.4** | Authenticate the CLI so agents can push | Install GitHub CLI (`winget install GitHub.cli`), then `gh auth login --web --scopes repo`. The copy currently at `%TEMP%\gh\bin\gh.exe` is unauthenticated and will vanish on a temp clean. |
| **O.5** | Supply an API key (needed for Tier 1 to be real) | Put `ANTHROPIC_API_KEY=sk-ant-...` in `server/.env` (gitignored). Per STATUS.md the coaching service has **never made one real model call**. |

**O.2 is why you kept seeing the old app.** It is a two-click fix and costs nothing.

---

## Wave 0 — Make the work safe (do this first, always)

Sequential. Lead agent only, no subagents. ~10 minutes.

### W0.0 — Back up every branch to GitHub

Nothing here is destructive and it removes the single-disk risk that currently
sits over 16 commits of world work.

```bash
cd /c/Users/Hendrickson/Desktop/GuitarApp
git push github h5-05content-backfill
git push github boardroom/growth-2026-08-30
git push github boardroom/content-pipeline-recon-20260826
git push github boardroom/content-pipeline-recon-20260825
```

**Acceptance:** `git ls-remote --heads github` lists all four branches.

### W0.1 — Lift the Emerald Hollow freeze — **DONE 2026-09-06**

`OWNS: docs/plans/README.md, docs/plans/STATUS.md, CLAUDE.md`

The owner signed off on unfreezing World 1 on 2026-09-06. Both frozen-scope
lists were amended — `docs/plans/README.md` **and** `CLAUDE.md`, which carried
its own copy of the list and would otherwise have kept blocking agents on its
own. `STATUS.md` has a Tier W section.

Nothing further to do here. Recorded so a later session doesn't re-litigate it:
the lift covers the Godot world shell and Emerald Hollow art production only.

---

## Wave 1 — See the world today (no merge, zero risk)

**This is the fastest path to the thing you actually want to see.** The Godot
project is self-contained; it does not need the merge, the web app, or GitHub.

Sequential. Lead agent only. Requires **O.1**.

### W1.1 — Check out the world beside the repo, without touching `main`

`git worktree` gives you a second folder on a different branch. `main` and your
working tree are untouched and this is fully reversible.

```bash
cd /c/Users/Hendrickson/Desktop/GuitarApp
git worktree add ../GuitarApp-world h5-05content-backfill
```

**Acceptance:** `C:\Users\Hendrickson\Desktop\GuitarApp-world\07-app\godot\project.godot`
exists, and `git -C /c/Users/Hendrickson/Desktop/GuitarApp status` is still clean
on `master`.

### W1.2 — Open it and press play

Owner step, but the agent should verify prerequisites first and report the exact
click path.

1. Launch Godot 4.7.x → **Import** → browse to
   `C:\Users\Hendrickson\Desktop\GuitarApp-world\07-app\godot\project.godot` → Import & Edit.
2. First import takes a few minutes (Godot reindexes every `.ogv`/`.wav`/`.png`).
3. Press **F5**.

**Expected:** the cold open plays — walk into Emerald Hollow, meet Sage, two-shot —
with Sage's voice over the second and third clips.

**Acceptance:** owner confirms the three clips play in order with audio. If a clip
is black or silent, the agent captures the Godot output-panel text verbatim and
reports it; **do not "fix" assets speculatively** — the `.ogv` files are known-good
Theora committed on 2026-08-30 (`a6ada63`, "playback fix").

**Known risk:** `project.godot` declares
`config/features=PackedStringArray("4.3", "GL Compatibility")` while the README
and the Stage-4 commit both say 4.7.x. Godot 4.7 will offer to convert the
project on import — **accept it** in the worktree. If conversion rewrites
`project.godot`, that edit belongs to Wave 3, not here; leave it uncommitted and
report it.

---

## Wave 2 — The merge (the one genuinely hard step)

**Recommendation: do this step with the strongest model you have, or have the
current session do it before you switch.** It is 38 conflicted files across code,
lesson content and docs. Everything after it is ordinary work that a cheap model
handles well; this step is where a wrong resolution silently corrupts a lesson
JSON or drops a Tier 1 engine change.

Requires **W0.0** (backup) and **W0.1** (freeze lifted).

### W2.0 — Lead: open the merge in a throwaway worktree

Never merge in the main working tree. If anything goes wrong, delete the folder.

```bash
cd /c/Users/Hendrickson/Desktop/GuitarApp
git worktree add ../GuitarApp-merge -b merge/world-into-main github/main
cd ../GuitarApp-merge
git merge --no-commit --no-ff h5-05content-backfill
# expect: "Automatic merge failed; fix conflicts and then commit the result."
git diff --name-only --diff-filter=U > /tmp/conflicts.txt
```

**Acceptance:** `git diff --name-only --diff-filter=U | wc -l` prints **38**. If
it prints anything else, the branches moved since 2026-09-06 — re-run the
`merge-tree` dry run and re-partition the groups below before dispatching.

### W2.1–W2.4 — Resolve, four agents in parallel

Dispatch all four in **one message, four `Agent` calls**, `subagent_type:
general-purpose`. The groups are disjoint by file, satisfying the
one-writer-per-file rule.

**Add these lines to the standard prompt template for every agent in this wave:**

```
You are resolving merge conflicts in an in-progress git merge at
C:\Users\Hendrickson\Desktop\GuitarApp-merge (NOT the main repo folder).

Resolve ONLY the files in your OWNS list. For each: remove every conflict
marker (<<<<<<<, =======, >>>>>>>) and produce one correct merged file.

"ours"   = main       = the shipping web app, work through 2026-09-06
"theirs" = h5 branch  = the Emerald Hollow world + content backfill, to 2026-08-30

RESOLUTION RULE: main is NEWER for app code. Default to main's version for
07-app/core/** and 07-app/app.js, and add back only the genuinely world-related
additions from the h5 side. Never delete a Tier 0/Tier 1 function to take an
older h5 version of it.

Do NOT run git commit, git merge, git checkout, git reset, or git add.
Leave the files resolved on disk; the lead agent stages and commits.
Report per file: which side you took and why, in one line each.
```

---

**W2.1 — App engine code** *(hardest; give this one the best model)*

```
OWNS:
  07-app/app.js
  07-app/core/adaptivePlan.js
  07-app/core/band-engine.js
  07-app/core/chatEngine.js
  07-app/core/pocketbaseSync.js
  07-app/core/practiceStore.js
  07-app/core/sageCoach.js
  07-app/core/pocketbaseSchema.json
  07-app/service-worker.js
  07-app/verify-sw-cache.mjs
```

Specific hazards, all documented in STATUS.md — an agent that ignores these will
regress Tier 1:

- `adaptivePlan.js` — **confidence is on a 0–100 scale.** Tier 1 fixed this from
  0–1. If the h5 side uses 0–1, main's version wins.
- `practiceStore.js` — main has `recordDrillResult(...)` / `getWeakPairs(k)` from
  T1.6 (2026-09-06). These must survive.
- `sageCoach.js` / `chatEngine.js` — main's `askCoach`/`replyWithCoach` are the
  Rule-5-safe path used by `coachSurface.js`. Keep main's; fold in only h5's
  Sage-personality/world strings if any.
- `band-engine.js` is a **frozen** file (README freeze list, still frozen). Take
  main's version verbatim; do not merge behavior into it.
- `service-worker.js` — main registers the SW (commit `816f088`). Keep main's
  cache list and **add** the world asset paths only if h5 introduced any.

**Acceptance:** `node 07-app/test/app-smoke.mjs` → 28/28;
`node 07-app/core/adaptivePlan.test.mjs`, `practiceStore.test.mjs`,
`sageCoach.test.mjs` all green; zero conflict markers remain in the OWNS list.

---

**W2.2 — Lesson & teacher content**

```
OWNS:
  05-content/VOICE-GUIDE.md
  05-content/guitar-lesson-01-welcome-anatomy-tuning.json
  05-content/guitar-lesson-03-first-chord-em.json
  05-content/guitar-lesson-05-strumming-in-time.json
  05-content/guitar-lesson-12-new-chord-am-big-four.json
  06-prototypes/step3/teachers/T1.json
  07-app/content/lessons/guitar-lesson-01-welcome-anatomy-tuning.json
  07-app/content/lessons/guitar-lesson-02-holding-the-pick.json
  07-app/content/lessons/guitar-lesson-03-first-chord-em.json
  07-app/content/lessons/guitar-lesson-04-second-chord-first-song.json
  07-app/content/lessons/guitar-lesson-05-strumming-in-time.json
  07-app/content/lessons/guitar-lesson-12-new-chord-am-big-four.json
  07-app/content/teachers/T1.json
```

**Hard rule from CLAUDE.md:** the `chords` blocks carry `qa_status` and are
**load-bearing**. Never hand-edit a fingering to resolve a conflict. If the two
sides disagree on a `chords` block, take the side whose `qa_status` is verified;
if both are, take main's and report the discrepancy rather than inventing a merge.

**Acceptance:** every file is valid JSON
(`node -e "require('./<file>')"` or `Get-Content | ConvertFrom-Json`);
`bash 07-app/test/chord-check.sh` and `bash 07-app/test/curriculum-order.sh` pass;
all 25 lesson files still present in `07-app/content/lessons/`.

---

**W2.3 — Docs, ADRs and project rules**

```
OWNS:
  .gitignore
  01-START-HERE/README.md
  02-spec/guitar-app-spec-AMENDMENT-17.md
  AGENTS.md
  docs/adr/0004-the-teacher-world-1-emerald-hollow.md
```

- `.gitignore` is an add/add conflict — take the **union** of both sides
  (`.env`, `.order-sandbox`, `__pycache__/*.pyc`, `_masters/`, `node_modules/`).
- `AGENTS.md` — union of rules; both sides added distinct ones. Rules 2, 5, 9 are
  non-negotiable and must appear exactly once.
- `docs/adr/0004` — this ADR is *ratified*. Take the h5 side where it is more
  complete on world content, and preserve main's "Resolved 2026-09-02" line
  about the Em→C performance song.

**Acceptance:** no conflict markers; `AGENTS.md` contains Rules 2, 5 and 9 exactly
once each.

---

**W2.4 — Retired handoffs and shell tooling** *(pure junk-drawer; cheapest model)*

```
OWNS:
  HANDOFF.md
  HANDOFF-grill4-teacher-20260823.md
  _RETIRED/handoffs/HANDOFF.md
  _RETIRED/handoffs/HANDOFF.md.bak-20260817
  _RETIRED/handoffs/HANDOFF-grill4-teacher-20260823.md
  docs/archive/2026-09-pre-tier0/HANDOFF.md
  docs/archive/2026-09-pre-tier0/HANDOFF-grill4-teacher-20260823.md
  tools/test-curriculum-order.sh
  tools/test-legal-redline.sh
  tools/test-song-progression-gate.sh
```

The HANDOFF files are the documented over-documentation problem. `main` already
retired them into `docs/archive/2026-09-pre-tier0/`. **Resolution: keep main's
archived copies, delete the root-level `HANDOFF.md` and
`HANDOFF-grill4-teacher-20260823.md` and the whole `_RETIRED/handoffs/` copies**
(`git rm` is not allowed for you — just empty is wrong; instead resolve to main's
state and report to the lead that these paths should be removed).

For the three `tools/*.sh` gates, take the h5 side — they are newer and the h5
branch is where they were written.

**Acceptance:** `bash tools/test-curriculum-order.sh` runs without a syntax error.

### W2.5 — Lead: integrate and commit

```bash
cd /c/Users/Hendrickson/Desktop/GuitarApp-merge
grep -rn "<<<<<<<\|>>>>>>>" --include="*.js" --include="*.json" --include="*.md" . | grep -v node_modules
npm run test:all          # expect 28/28 smoke + 19/19 playwright
npm run test:fidelity     # expect 84/84
git add -A && git commit
```

**Acceptance:** grep returns nothing; `test:all` and `test:fidelity` green at the
counts STATUS.md records. **Only then** fast-forward `main`:

```bash
cd /c/Users/Hendrickson/Desktop/GuitarApp
git checkout master && git merge --ff-only merge/world-into-main
git push github HEAD:main
```

If `test:all` is not green, **stop and report**. Do not push a red merge.

---

## Wave 3 — Make the world load a real lesson

Requires Wave 2. This is where the world stops being a cutscene and becomes the
product described in ADR-0004. Two agents, parallel.

### W3.1 — Godot project hygiene

```
OWNS: 07-app/godot/project.godot, 07-app/godot/README.md
```

Reconcile the engine version (`config/features` says 4.3; the project targets
4.7.x). Set it to what Godot 4.7 writes after conversion. Confirm
`run/main_scene="res://world/World.tscn"` and the portrait 720×1280 viewport are
intact.

**Acceptance:** the project opens in Godot 4.7 with **zero** import errors in the
output panel, and F5 still plays the cold open (owner confirms once).

### W3.2 — Replace the demo hook with a real lesson entry

```
OWNS: 07-app/godot/world/World.gd, 07-app/godot/data/lesson_manifest.json
```

`World.gd::_ready()` currently hard-codes `enter_lesson("W1-coldopen")` with an
inline `# DEMO HOOK` comment saying to remove it once a real menu exists. Build
the real path:

1. After the cold open finishes, show the lesson "doors" that `_build_world_entry()`
   currently only `print()`s — as actual on-screen buttons.
2. Selecting Lesson 1 calls `enter_lesson("L01-...")`.
3. `lesson_manifest.json`'s `L01-open-c` entry carries a `_todo_blocked` marker
   because `assets/lessons/L01-open-c.mp4` was never generated. **Do not fabricate
   that asset.** Point L01 at the existing Emerald Hollow stills
   (`assets/worlds/emerald-hollow/stills/sage_porch.png`) as a static backdrop and
   note the gap.

**Acceptance:** F5 → cold open plays → a lesson list appears → clicking Lesson 1
enters a scene that does not error. Report the Godot output panel verbatim.

---

## Wave 4 — The architecture decision (OWNER — do not let an agent decide)

**This is the fork in the road and it is not a technical detail.** You currently
have two front ends and they do not talk to each other:

- **The web app** (`07-app/`) has all 25 lessons, the practice drills, the tuner,
  the listening engine and the adaptive coach. It runs in a browser today.
- **The Godot world** (`07-app/godot/`) has Emerald Hollow, Sage, the clips and
  the voice. It has *no* lesson logic — `lesson_manifest.json` holds two entries.

ADR-0004 says Godot is "the story-world shell for the whole app." Taken
literally, the 25 lessons eventually move into Godot. That is a very large
rewrite of working, tested code.

| Option | What it means | Cost | Risk |
|---|---|---|---|
| **A. Godot wraps everything** | Port lesson rendering, drills, tuner into Godot. One app. | Very high — re-implements all of Tier 0/1 | High. Throws away tested code |
| **B. Web app stays; world is the front door** | Godot exports to HTML5; the cold open plays, then hands off to the existing web app for the lesson | Medium | Medium. Two runtimes, one URL |
| **C. Keep both separate for now** | Ship the web app publicly; run the world locally as the thing you're building toward | Low | Low. But the world isn't in front of students yet |

**Recommendation: C now, B next.** You have zero of your five test users on the
app (STATUS.md: "Five real users have opened it: 0 / 5"). Getting the working
web app in front of people is worth more this month than unifying the runtimes,
and B stays available because nothing in Wave 2 or 3 forecloses it.

**Do not start Wave 5 until this is answered.** Record the answer as
`docs/adr/0005-world-app-integration.md`.

---

## Wave 5 — Ship the web app publicly

Requires Wave 2 + **O.2/O.3**. Independent of Wave 4's answer.

### W5.1 — First green deploy

`OWNS: .github/workflows/deploy-pages.yml`

The workflow only triggers on pushes touching `07-app/**` or itself. After the
Wave 2 merge lands on `main` it should fire automatically. Add `workflow_dispatch`
usage instructions to the file header; it already has the trigger.

**Acceptance:** `https://pando11.github.io/GuitarApp/` returns **200** and serves
the current app (title `GuitarApp - Emerald Hollow`, `#practice-view` present in
the HTML). It returns 404 today.

### W5.2 — Deduplicate world assets

`OWNS: 07-app/assets/worlds/**`

`07-app/assets/worlds/emerald-hollow/clips/` holds `.mp4` **and** `.ogv` copies of
all three clips (~19 MB) that only Godot's copy under `07-app/godot/assets/` is
actually read from. Every one of those bytes currently ships to every phone that
loads the PWA.

Confirm nothing in `07-app/**` outside `godot/` references
`assets/worlds/` (`grep -rn "assets/worlds" 07-app --include=*.js --include=*.html`),
then delete the duplicate and keep Godot's.

**Acceptance:** grep finds no live reference; `npm run test:all` still green; the
Pages artifact drops by ~19 MB.

### W5.3 — The five-user test (OWNER)

STATUS.md's Tier 0 exit check. Five people who are not you open the URL and one
completes Lesson 3. **Tier 0 is not shipped until this is true**, and Tier 2 is
gated behind it.

---

## Wave 6 — Close out Tier 1

Requires **O.5** (API key). These are the gaps STATUS.md lists as blocking a real
Tier 1 demo. Three agents, parallel — the OWNS lists are disjoint.

| ID | Task | OWNS | Acceptance |
|----|------|------|-----------|
| **W6.1** | First real model call. The coaching service has only ever run against a mocked SDK client. Run it against a live key; verify `coach_served` telemetry and a prompt-cache hit. | `server/**` | One real coached response logged; cache-hit observed on the second call |
| **W6.2** | Wire `askCoach` into the lesson flow. It is reachable only from the practice screen today. | `07-app/core/lesson-runner.js` | A student can trigger a coaching moment from inside a lesson; Rule 5 holds (cites stored numbers only) |
| **W6.3** | Call `lessonRunner.planNext()`. It is built, tested and **called from nowhere** — there is no "continue"/next-lesson navigation. | `07-app/app.js`, `07-app/index.html` | Finishing a lesson offers an adaptively-chosen next lesson |

Then **Tier 2** ([`TIER-2-business.md`](TIER-2-business.md)) — accounts, payments,
pricing. It is `BLOCKED (Tier 1)` and stays that way until Wave 6 is done and
W5.3 is 5/5. Two of its tasks (T2.4 pricing, T2.5 acquisition channel) are
**undecided owner questions** — see STATUS.md § Open owner decisions.

---

## Running this with a cheaper model

The orchestration contract in [`README.md`](README.md) already covers the prompt
template and the one-writer-per-file rule — follow it exactly; it is what keeps
parallel agents from corrupting each other's work. Additions for a cost-efficient
lead:

**Model allocation.** Not every wave needs the same horsepower:

| Wave | Suggested | Why |
|---|---|---|
| W0, W1 | cheapest | Mechanical git + install steps |
| **W2.1** | **strongest available** | Silent Tier 1 regressions are the real risk in this whole plan |
| W2.2 | strong | Lesson JSON is load-bearing and a bad merge is invisible until a student sees a wrong chord |
| W2.3, W2.4 | cheap | Docs and junk-drawer |
| W3, W5, W6 | mid (Sonnet) | Ordinary feature work with clear acceptance tests |

**Rules that matter more when the lead is a cheap model:**

1. **Never skip the acceptance command.** Every task above ends in a command with
   an expected number. A cheap model is much likelier to *claim* success than to
   verify it. Paste real output or the task is not done.
2. **One wave at a time.** Do not let an agent start Wave 3 because Wave 2 "looks
   finished." Wave 2 is finished when `test:all` is 28/28 + 19/19.
3. **Never `git push --force`,** and never resolve a conflict by deleting the
   confusing half. If a conflict is not understood, report it — the merge
   worktree can sit unfinished indefinitely at zero cost.
4. **Stop at Wave 4.** It is an owner decision with a large, hard-to-reverse cost
   attached. An agent must not pick an option.
5. **Update `STATUS.md`, create nothing else.** The repo's over-documentation
   problem (~45 status docs against 11 code commits) is why this rule exists.

---

## Open decisions this plan cannot make for you

1. **Wave 4 — Godot-wraps-all vs world-as-front-door vs keep-separate.** The
   single largest scope question in the project.
2. **What happens to `master` on GitHub.** Recommended: rename to
   `archive/master-2026-08-12` rather than delete.
3. **`app-refactored.js`** — ~1500 lines diverged from `app.js`, unresolved since
   before Tier 0, dead weight in every agent's search results. Delete or reconcile.
4. Carried over from STATUS.md and still undecided: free-tier scope, acquisition
   channel, under-13 policy, and Level 2's exact lesson gate in the ADR-0004
   performance ladder.
