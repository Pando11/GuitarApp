# Render deploy notes for the coach service

This directory holds deploy config for the parts of GuitarApp that need it.
`netlify.toml` here configures the **static app** (`07-app/`) on Netlify.
The **coach service** (`server/`) is different: it's a persistent Node
process, not static content, so it can't be served by Netlify, GitHub
Pages, or any other static host — it needs its own always-on host. That
host is **Render**, paid "Starter" tier (~$7/mo), decided 2026-09-10
(`docs/plans/TIER-1B-close-the-gaps.md`, decision 3).

Render's actual config file lives at `server/render.yaml` instead of here,
deliberately — it's colocated with the service it deploys, one directory
below this one, the same way `netlify.toml` sits next to nothing because
Netlify's config applies to the whole repo checkout. If you came here
looking for the Render equivalent of `netlify.toml`, that's it:
[`../server/render.yaml`](../server/render.yaml).

For the full walkthrough — creating the Render account, connecting the
repo, the exact dashboard fields, setting env vars, getting the deployed
URL, and wiring that URL into `.github/workflows/deploy-pages.yml` via the
`COACH_URL` repository variable — see
[`../server/README.md`](../server/README.md)'s "Deployment — Render"
section. This file is intentionally just a pointer, to avoid the same
deploy instructions living in two places and drifting apart.
