Type: task
Status: resolved
Blocked by:

## Question

What is the verified live state of the GuitarApp repo right now, and what planning work must respect that truth before new development starts?

## Answer

Verified this session:
- `Desktop/GuitarApp` exists on disk.
- Core working directories exist: `05-content`, `06-prototypes`, `07-app`, `tools`, `brand-references`, `docs/adr`, and `.scratch`.
- Core files also exist on disk: `07-app/app.js`, `07-app/manifest.webmanifest`, `07-app/service-worker.js`, `tools/verify-curriculum-order.js`, `tools/verify-song-progressions.js`, and `06-prototypes/step0/run-chord-check.js`.
- `AGENTS.md` still says AMENDMENT-16 is the latest word, while `01-START-HERE/README.md` points at AMENDMENT-17. That means the pointer files are out of sync and must not be treated as automatically current.
- AMENDMENT-17 and ADR-0004 are both still marked **proposed**, so the World 1 teacher/performance slice is not fully ratified yet.

Planning consequence:
- New development should start from verified disk state plus the proposed-vs-ratified status, not from old prose summaries.
- The next useful decisions are to ratify or revise the World 1 slice, then lock the first shippable factory slice.
