# AMENDMENT-16 — Backend: PocketBase replaces Supabase (2026-08-16, binding)

## Decision
The GuitarApp backend database/auth/storage layer is **PocketBase**, not Supabase.

- **PocketBase** (`pocketbase/pocketbase` on GitHub): MIT-licensed, open source,
  self-hosted, ships as a single Go binary with an embedded SQLite database.
  Provides auth + DB + file storage + row-level rules (RLS equivalent) + realtime
  (cross-device sync) in one process. **Free to self-host — no $25/mo Pro tier.**
- Latest verified release at decision time: **v0.39.11** (2026-08-14), ~60.7k stars.
- Binary actually downloaded and executed on this Windows host to prove it runs
  (`serve` on 127.0.0.1:8090, `superuser`, `migrate`, `update` commands present).
  ACEMAGIC box (Linux, no OS yet) will run the `linux_amd64` build post-arrival.

## Why (owner directive)
Owner chose PocketBase over Supabase to stay inside the **free + commercial-clean,
no-paid-tools** GuitarApp rule. Supabase's hosted cloud costs $25/mo (Pro) once you
outgrow the free tier; PocketBase self-hosted has no recurring backend bill. MIT
license is commercial-clean (cleared vs the paid-tool blocklist).

## What PocketBase covers vs. what stays on-device
- **PocketBase (cloud, self-hosted):** user auth/accounts, subscription entitlement
  record (paired with RevenueCat), lesson/content storage + delivery, and
  cross-device sync of the student profile.
- **On-device ONLY (unchanged, AMENDMENT-11 Red Line 1):** the student's *learning*
  progress / performance history. The listening engine (basic-pitch/CREPE) and
  hand-shape check (MediaPipe) run on-device; audio is never uploaded. If cross-device
  sync of progress is ever desired, it must be **encrypted client-side** before reaching
  PocketBase — this is an open design question, not yet built.

## Edge / coaching
- Stateless LLM coaching endpoint: Cloudflare Workers **or** PocketBase API rules/hooks.
- RevenueCat (subs), PostHog (funnels/retention), Sentry (crash reporting) unchanged.

## Supersedes
- `guitar-app-spec.md` §5 backend block and the "Backend:" line in the feature list —
  both updated in-place to name PocketBase.
- Prior Supabase references in `FEATURES-LOCKED-v1-2026-08-07.md`,
  `guitar-app-spec-AMENDMENT-01.md`, `guitar-build-plan.md` are historical; this
  amendment is the current backend truth.

## Out of scope
- Ops / `~/team-ops` (nurse PII) does NOT use PocketBase — it remains a local
  file-based system. Real PII must not be placed in any hosted database.
